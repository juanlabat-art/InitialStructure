from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.comunidad_dto import (
    ComunidadResponseDTO,
    CreateComunidadDTO,
    UpdateComunidadDTO,
)
from src.schemas.comunidad_schema import CreateComunidadSchema, UpdateComunidadSchema
from src.services.comunidad_service import ComunidadService


router = APIRouter(prefix="/comunidad", tags=["comunidades"])


@router.post("/", response_model=ComunidadResponseDTO, status_code=status.HTTP_201_CREATED)
def create_comunidad(payload: CreateComunidadSchema, db: Session = Depends(get_db)):
    dto = CreateComunidadDTO(**payload.model_dump())
    return ComunidadService(db).create(dto)


@router.get("/", response_model=list[ComunidadResponseDTO])
def list_comunidades(db: Session = Depends(get_db)):
    return ComunidadService(db).list_all()


@router.get("/{comunidad_id}", response_model=ComunidadResponseDTO)
def get_comunidad(comunidad_id: int, db: Session = Depends(get_db)):
    return ComunidadService(db).get_by_id(comunidad_id)


@router.put("/{comunidad_id}", response_model=ComunidadResponseDTO)
def update_comunidad(
    comunidad_id: int,
    payload: UpdateComunidadSchema,
    db: Session = Depends(get_db),
):
    dto = UpdateComunidadDTO(**payload.model_dump())
    return ComunidadService(db).update(comunidad_id, dto)


@router.delete("/{comunidad_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comunidad(comunidad_id: int, db: Session = Depends(get_db)):
    ComunidadService(db).delete(comunidad_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)