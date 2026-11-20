from fastapi import APIRouter, Depends, Path, Response, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.voto_comentario_dto import (
    PuntajeComentarioResponseDTO,
    VotarComentarioDTO,
    VotoComentarioResponseDTO,
)
from src.middlewares.integridad_middleware import RutaConIntegridad
from src.schemas.voto_comentario_schema import VotarComentarioSchema
from src.services.voto_comentario_service import VotoComentarioService


router = APIRouter(
    prefix="/votos-comentario", tags=["votos de comentarios"], route_class=RutaConIntegridad
)


@router.put("/", response_model=VotoComentarioResponseDTO)
def votar_comentario(payload: VotarComentarioSchema, db: Session = Depends(get_db)):
    dto = VotarComentarioDTO(**payload.model_dump())
    return VotoComentarioService(db).votar(dto)


@router.get("/{comentario_id}", response_model=PuntajeComentarioResponseDTO)
def get_puntaje(comentario_id: int = Path(gt=0), db: Session = Depends(get_db)):
    return VotoComentarioService(db).get_puntaje(comentario_id)


@router.delete("/{comentario_id}/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def quitar_voto(
    comentario_id: int = Path(gt=0),
    usuario_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    VotoComentarioService(db).quitar(comentario_id, usuario_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
