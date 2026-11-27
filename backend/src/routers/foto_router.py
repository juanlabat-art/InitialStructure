from hashlib import sha256
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as postgres_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.comunidad_model import Comunidad
from src.db.models.foto_model import banners_comunidad, fotos_comunidad, fotos_usuario
from src.services.foro_service import ForumService
from src.services.foto_service import MAX_BYTES, preparar_imagen
from src.services.sesion_service import usuario_actual


router = APIRouter(prefix="/fotos", tags=["fotos"])
TipoFoto = Literal["usuarios", "comunidades"]
TABLAS = {"usuarios": fotos_usuario, "comunidades": fotos_comunidad}
INSERTAR = {"sqlite": sqlite_insert, "postgresql": postgres_insert}


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


@router.get("/{tipo}/{titular_id}", response_class=Response)
def descargar_foto(tipo: Literal["usuarios", "comunidades", "banners"], titular_id: int, request: Request, db: Session = Depends(get_db)):
    tabla = banners_comunidad if tipo == "banners" else TABLAS[tipo]
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
