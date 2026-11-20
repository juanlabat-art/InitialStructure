from fastapi import APIRouter, Depends, Path, Response, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.miembro_comunidad_dto import (
    CreateMiembroComunidadDTO,
    MiembroComunidadResponseDTO,
    UpdateMiembroComunidadDTO,
)
from src.middlewares.integridad_middleware import RutaConIntegridad
from src.schemas.miembro_comunidad_schema import (
    CreateMiembroComunidadSchema,
    UpdateMiembroComunidadSchema,
)
from src.services.miembro_comunidad_service import MiembroComunidadService


router = APIRouter(
    prefix="/miembros-comunidad", tags=["miembros de comunidades"], route_class=RutaConIntegridad
)


@router.post("/", response_model=MiembroComunidadResponseDTO, status_code=status.HTTP_201_CREATED)
def create_miembro(payload: CreateMiembroComunidadSchema, db: Session = Depends(get_db)):
    dto = CreateMiembroComunidadDTO(**payload.model_dump())
    return MiembroComunidadService(db).create(dto)


@router.get("/{comunidad_id}", response_model=list[MiembroComunidadResponseDTO])
def list_miembros(comunidad_id: int = Path(gt=0), db: Session = Depends(get_db)):
    return MiembroComunidadService(db).list_by_comunidad(comunidad_id)


@router.get("/{comunidad_id}/{usuario_id}", response_model=MiembroComunidadResponseDTO)
def get_miembro(
    comunidad_id: int = Path(gt=0),
    usuario_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    return MiembroComunidadService(db).get(comunidad_id, usuario_id)


@router.put("/{comunidad_id}/{usuario_id}", response_model=MiembroComunidadResponseDTO)
def update_miembro(
    payload: UpdateMiembroComunidadSchema,
    comunidad_id: int = Path(gt=0),
    usuario_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    dto = UpdateMiembroComunidadDTO(**payload.model_dump())
    return MiembroComunidadService(db).update(comunidad_id, usuario_id, dto)


@router.delete("/{comunidad_id}/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_miembro(
    comunidad_id: int = Path(gt=0),
    usuario_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    MiembroComunidadService(db).delete(comunidad_id, usuario_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
