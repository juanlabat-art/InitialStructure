from fastapi import APIRouter, Depends, Path, Response, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.post_guardado_dto import GuardarPostDTO, PostGuardadoResponseDTO
from src.middlewares.integridad_middleware import RutaConIntegridad
from src.schemas.post_guardado_schema import GuardarPostSchema
from src.services.post_guardado_service import PostGuardadoService


router = APIRouter(prefix="/posts-guardados", tags=["posts guardados"], route_class=RutaConIntegridad)


@router.put("/", response_model=PostGuardadoResponseDTO)
def guardar_post(payload: GuardarPostSchema, db: Session = Depends(get_db)):
    dto = GuardarPostDTO(**payload.model_dump())
    return PostGuardadoService(db).guardar(dto)


@router.get("/{usuario_id}", response_model=list[PostGuardadoResponseDTO])
def list_guardados(usuario_id: int = Path(gt=0), db: Session = Depends(get_db)):
    return PostGuardadoService(db).list_by_usuario(usuario_id)


@router.delete("/{usuario_id}/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def quitar_guardado(
    usuario_id: int = Path(gt=0),
    post_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    PostGuardadoService(db).quitar(usuario_id, post_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
