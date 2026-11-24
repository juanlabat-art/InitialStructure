from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.services.sesion_service import exigir_servidor_web, sesion_actual, usuario_actual, verificar_actor
from src.dtos.comentario_dto import (
    ComentarioResponseDTO,
    CreateComentarioDTO,
    UpdateComentarioDTO,
)
from src.schemas.comentario_schema import (
    CreateComentarioSchema,
    UpdateComentarioSchema,
)
from src.services.comentario_service import ComentarioService
from src.schemas.eliminacion_schema import ConfirmarEliminacionSchema


router = APIRouter(
    prefix="/comentario",
    tags=["comentarios"],
)


@router.post(
    "/",
    response_model=ComentarioResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_comentario(
    payload: CreateComentarioSchema,
    actor=Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    verificar_actor(actor, payload.autor_id)
    dto = CreateComentarioDTO(**payload.model_dump())
    return ComentarioService(db).create(dto)


@router.get("/", response_model=list[ComentarioResponseDTO])
def list_comentarios(
    post_id: int = Query(gt=0),
    usuario_id=Depends(sesion_actual),
    db: Session = Depends(get_db),
):
    return ComentarioService(db).list_by_post(post_id, usuario_id)


@router.get(
    "/{comentario_id}",
    response_model=ComentarioResponseDTO,
)
def get_comentario(
    comentario_id: int,
    usuario_id=Depends(sesion_actual),
    db: Session = Depends(get_db),
):
    return ComentarioService(db).get_by_id(comentario_id, usuario_id)


@router.put(
    "/{comentario_id}",
    response_model=ComentarioResponseDTO,
)
def update_comentario(
    comentario_id: int,
    payload: UpdateComentarioSchema,
    actor=Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    dto = UpdateComentarioDTO(**payload.model_dump())
    return ComentarioService(db).update(comentario_id, dto, actor)


@router.delete(
    "/{comentario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(exigir_servidor_web)],
    include_in_schema=False,
)
def delete_comentario(
    comentario_id: int,
    confirmaciones: ConfirmarEliminacionSchema,
    actor=Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    ComentarioService(db).delete(comentario_id, actor)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
