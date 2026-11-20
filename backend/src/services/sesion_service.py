from datetime import datetime, timedelta, timezone
from hashlib import scrypt, sha256
from hmac import compare_digest
from secrets import token_bytes, token_urlsafe

import jwt
from fastapi import Cookie, Depends, HTTPException, Request, Response
from sqlalchemy import delete, insert, select
from sqlalchemy.orm import Session

from src.config.env import settings
from src.db.connection import get_db
from src.db.models.usuario_model import Usuario, sesiones
from src.services.foro_service import utc_now


COOKIE = "punto_cuenta"
DURACION = timedelta(days=7)
ALGORITMO = "HS256"
EMISOR = "vozero"
AUDIENCIA = "vozero-sesion"


def _derivar(clave, sal):
    return scrypt(clave.encode(), salt=sal, n=2**15, r=8, p=1, maxmem=64 * 1024**2)


def hash_clave(clave):
    sal = token_bytes(16)
    return sal.hex() + ":" + _derivar(clave, sal).hex()


def verificar_clave(clave, guardada):
    if not guardada:
        return False
    sal, derivada = guardada.split(":")
    return compare_digest(_derivar(clave, bytes.fromhex(sal)), bytes.fromhex(derivada))


def _hash_token(token):
    return sha256(token.encode()).hexdigest()


def iniciar_sesion(db: Session, usuario: Usuario, request: Request, response: Response) -> None:
    ahora = datetime.now(timezone.utc).replace(microsecond=0)
    vence = ahora + DURACION
    token = jwt.encode(
        {
            "sub": str(usuario.id),
            "jti": token_urlsafe(32),
            "iss": EMISOR,
            "aud": AUDIENCIA,
            "iat": ahora,
            "exp": vence,
        },
        settings.VOZERO_JWT_SECRET.get_secret_value(),
        algorithm=ALGORITMO,
    )
    db.execute(delete(sesiones).where(sesiones.c.vence <= ahora.replace(tzinfo=None)))
    _revocar_token(db, request.cookies.get(COOKIE))
    db.execute(insert(sesiones).values(
        token_hash=_hash_token(token), usuario_id=usuario.id, vence=vence.replace(tzinfo=None),
    ))
    db.commit()
    response.set_cookie(
        COOKIE, token, max_age=int(DURACION.total_seconds()), httponly=True,
        secure=request.url.scheme == "https", samesite="lax",
    )


def _revocar_token(db: Session, token: str | None) -> None:
    if token:
        db.execute(delete(sesiones).where(sesiones.c.token_hash == _hash_token(token)))


def cerrar_sesion(db: Session, token: str | None, response: Response) -> None:
    if token:
        _revocar_token(db, token)
        db.commit()
    response.delete_cookie(COOKIE, httponly=True, samesite="lax")


def token_sesion(punto_cuenta: str | None = Cookie(default=None)):
    return punto_cuenta


def sesion_actual(token: str | None = Depends(token_sesion), db: Session = Depends(get_db)) -> int | None:
    if not token:
        return None

    try:
        claims = jwt.decode(
            token,
            settings.VOZERO_JWT_SECRET.get_secret_value(),
            algorithms=[ALGORITMO],
            issuer=EMISOR,
            audience=AUDIENCIA,
            options={"require": ["sub", "jti", "iss", "aud", "iat", "exp"], "strict_aud": True},
        )
        usuario_id = int(claims["sub"])
        if not 0 < usuario_id <= 2**31 - 1:
            return None
    except (jwt.InvalidTokenError, ValueError):
        return None

    return db.scalar(select(sesiones.c.usuario_id).where(
        sesiones.c.token_hash == _hash_token(token),
        sesiones.c.usuario_id == usuario_id,
        sesiones.c.vence > utc_now(),
    ))


def usuario_actual(usuario_id: int | None = Depends(sesion_actual)) -> int:
    if usuario_id is None:
        raise HTTPException(401, "Iniciá sesión para realizar esta acción")
    return usuario_id


def verificar_actor(autenticado, solicitado):
    if autenticado != solicitado:
        raise HTTPException(403, "La acción debe realizarse desde tu propia cuenta")
