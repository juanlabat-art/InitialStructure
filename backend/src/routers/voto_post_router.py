from fastapi import APIRouter, Depends, Path, Response, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.services.sesion_service import usuario_actual, verificar_actor
from src.dtos.voto_post_dto import (
    PuntajePostResponseDTO,
    VotarPostDTO,
    VotoPostResponseDTO,
)
from src.schemas.voto_post_schema import VotarPostSchema
from src.services.voto_post_service import VotoPostService


router = APIRouter(
    prefix="/votos-post",
    tags=["votos de posts"],
)


@router.put("/", response_model=VotoPostResponseDTO | None)
def votar_post(
    payload: VotarPostSchema,
    actor=Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    verificar_actor(actor, payload.usuario_id)
    dto = VotarPostDTO(**payload.model_dump())
    return VotoPostService(db).votar(dto)


@router.get("/{post_id}", response_model=PuntajePostResponseDTO)
def get_puntaje(
    post_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    return VotoPostService(db).get_puntaje(post_id)


@router.delete(
    "/{post_id}/{usuario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def quitar_voto(
    post_id: int = Path(gt=0),
    usuario_id: int = Path(gt=0),
    actor=Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    verificar_actor(actor, usuario_id)
    VotoPostService(db).quitar(post_id, usuario_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)