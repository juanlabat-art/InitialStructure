from pydantic import BaseModel, EmailStr, Field

from src.schemas.eliminacion_schema import ConfirmarEliminacionSchema


class CredencialesUsuarioSchema(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_.]+$")
    clave: str = Field(min_length=8, max_length=128)


class CreateUsuarioSchema(CredencialesUsuarioSchema):
    email: EmailStr


class EliminarCuentaSchema(ConfirmarEliminacionSchema):
    usuario_id: int
