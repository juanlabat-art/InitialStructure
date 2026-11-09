from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.usuario_dto import CreateUsuarioDTO, UsuarioResponseDTO
from src.schemas.usuario_schema import CreateUsuarioSchema
from src.services.usuario_service import UsuarioService

router = APIRouter(prefix="/usuario", tags=["usuarios"])


@router.post("/", response_model=UsuarioResponseDTO, status_code=status.HTTP_201_CREATED)
def create_usuario(payload: CreateUsuarioSchema, db: Session = Depends(get_db)):
    """Ejemplo completo: valida con Schema, arma DTO, llama al service."""
    dto = CreateUsuarioDTO(**payload.model_dump())
    return UsuarioService(db).create(dto)


@router.get("/{usuario_id}", response_model=UsuarioResponseDTO)
def get_usuario(usuario_id: int, db: Session = Depends(get_db)):
    # TODO: llamar a UsuarioService(db).get_by_id(user_id) y devolver el resultado
    ...


@router.get("/", response_model=list[UsuarioResponseDTO])
def list_usuarios(db: Session = Depends(get_db)):
    return UsuarioService(db).list_all()
    ...


@router.put("/{usuario_id}", response_model=UsuarioResponseDTO)
def update_usuario(usuario_id: int, db: Session = Depends(get_db)):
    # TODO: recibir un UpdateUserSchema, llamar al service, devolver el DTO actualizado
    ...


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(usuario_id: int, db: Session = Depends(get_db)):
    # TODO: llamar a UserService(db).delete(user_id)
    ...
