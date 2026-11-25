from io import BytesIO
from typing import Literal
from hashlib import sha256

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from PIL import Image, ImageOps
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as postgres_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.comunidad_model import Comunidad
from src.db.models.foto_model import fotos_comunidad, fotos_usuario
from src.services.foro_service import ForumService
from src.services.sesion_service import usuario_actual


router = APIRouter(prefix="/fotos", tags=["fotos"])
TipoFoto = Literal["usuarios", "comunidades"]
TABLAS = {"usuarios": fotos_usuario, "comunidades": fotos_comunidad}
INSERTAR = {"sqlite": sqlite_insert, "postgresql": postgres_insert}
MAX_BYTES = 5 * 1024 * 1024
MAX_PIXELES = 32_000_000
FORMATOS = ("JPEG", "PNG", "WEBP")


def comprobar_editor(tipo: TipoFoto, titular_id: int, actor: int = Depends(usuario_actual),
                     db: Session = Depends(get_db)):
    if tipo == "usuarios":
        autorizado = titular_id == actor
    else:
        if db.get(Comunidad, titular_id, with_for_update=True) is None:
            raise HTTPException(404, "La comunidad no existe")
        autorizado = ForumService(db).role(titular_id, actor) == "moderador"
    if not autorizado:
        raise HTTPException(403, "No tenés permiso para cambiar esta foto")


async def leer_imagen(request: Request) -> bytes:
    contenido = bytearray()
    async for parte in request.stream():
        if len(contenido) + len(parte) > MAX_BYTES:
            raise HTTPException(413, "La foto tiene que pesar como máximo 5 MB")
        contenido.extend(parte)
    return bytes(contenido)


def preparar_imagen(contenido: bytes) -> bytes:
    try:
        with Image.open(BytesIO(contenido), formats=FORMATOS) as imagen:
            if imagen.width * imagen.height > MAX_PIXELES:
                raise HTTPException(422, "La foto supera los 32 megapíxeles")
            if getattr(imagen, "is_animated", False):
                raise HTTPException(422, "Elegí una foto sin animación")
            orientada = ImageOps.exif_transpose(imagen).convert("RGBA")
            miniatura = ImageOps.fit(orientada, (256, 256), Image.Resampling.LANCZOS)
            miniatura.info.clear()
            resultado = BytesIO()
            miniatura.save(resultado, "WEBP", quality=85)
            return resultado.getvalue()
    except (Image.DecompressionBombError, OSError, ValueError) as error:
        raise HTTPException(422, "Elegí una foto válida en formato JPG, PNG o WebP") from error


@router.get("/{tipo}/{titular_id}", response_class=Response)
def descargar_foto(tipo: TipoFoto, titular_id: int, request: Request, db: Session = Depends(get_db)):
    tabla = TABLAS[tipo]
    fila = db.execute(select(tabla.c.version, tabla.c.contenido).where(tabla.c.id == titular_id)).one_or_none()
    if fila is None:
        raise HTTPException(404, "No hay una foto guardada")
    etag = f'"{fila.version}"'
    headers = {"Cache-Control": "private, no-cache", "ETag": etag, "X-Content-Type-Options": "nosniff"}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)
    return Response(fila.contenido, media_type="image/webp", headers=headers)


@router.put(
    "/{tipo}/{titular_id}", status_code=204, dependencies=[Depends(comprobar_editor)],
    openapi_extra={"requestBody": {"required": True, "content": {
        "application/octet-stream": {"schema": {"type": "string", "format": "binary"}},
    }}},
)
def guardar_foto(tipo: TipoFoto, titular_id: int, contenido: bytes = Depends(leer_imagen),
                db: Session = Depends(get_db)):
    imagen = preparar_imagen(contenido)
    tabla = TABLAS[tipo]
    version = sha256(imagen).hexdigest()
    insert = INSERTAR[db.bind.dialect.name](tabla).values(id=titular_id, contenido=imagen, version=version)
    db.execute(insert.on_conflict_do_update(index_elements=[tabla.c.id], set_={
        "contenido": insert.excluded.contenido, "version": insert.excluded.version,
    }))
    db.commit()


@router.delete("/{tipo}/{titular_id}", status_code=204, dependencies=[Depends(comprobar_editor)])
def quitar_foto(tipo: TipoFoto, titular_id: int, db: Session = Depends(get_db)):
    tabla = TABLAS[tipo]
    db.execute(delete(tabla).where(tabla.c.id == titular_id))
    db.commit()
