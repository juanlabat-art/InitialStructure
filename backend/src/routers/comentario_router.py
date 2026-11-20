from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
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
    db: Session = Depends(get_db),
):
    dto = CreateComentarioDTO(**payload.model_dump())
    return ComentarioService(db).create(dto)


@router.get("/", response_model=list[ComentarioResponseDTO])
def list_comentarios(
    post_id: int = Query(gt=0),
    db: Session = Depends(get_db),
):
    return ComentarioService(db).list_by_post(post_id)


@router.get(
    "/{comentario_id}",
    response_model=ComentarioResponseDTO,
)
def get_comentario(
    comentario_id: int,
    db: Session = Depends(get_db),
):
    return ComentarioService(db).get_by_id(comentario_id)


@router.put(
    "/{comentario_id}",
    response_model=ComentarioResponseDTO,
)
def update_comentario(
    comentario_id: int,
    payload: UpdateComentarioSchema,
    db: Session = Depends(get_db),
):
    dto = UpdateComentarioDTO(**payload.model_dump())
    return ComentarioService(db).update(comentario_id, dto)


@router.delete(
    "/{comentario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_comentario(
    comentario_id: int,
    db: Session = Depends(get_db),
):
    ComentarioService(db).delete(comentario_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)