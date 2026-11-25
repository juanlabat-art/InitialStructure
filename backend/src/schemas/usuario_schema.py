from string import digits
from unicodedata import category

from pydantic import BaseModel, EmailStr, Field, field_validator

from src.schemas.eliminacion_schema import ConfirmarEliminacionSchema


class CredencialesUsuarioSchema(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_.]+$")
    clave: str = Field(min_length=8, max_length=128)


class CreateUsuarioSchema(CredencialesUsuarioSchema):
    email: EmailStr

    @field_validator("clave")
    @classmethod
    def validar_complejidad(cls, clave: str) -> str:
        categorias = {category(caracter) for caracter in clave}
        if (
            "Lu" not in categorias
            or not any(caracter in digits for caracter in clave)
            or not any(tipo.startswith(("P", "S")) for tipo in categorias)
        ):
            raise ValueError("La contraseña debe incluir una mayúscula, un número y un carácter especial")
        return clave


class EliminarCuentaSchema(ConfirmarEliminacionSchema):
    usuario_id: int


class EditarPerfilSchema(BaseModel):
    descripcion: str = Field(max_length=300)

    @field_validator("descripcion", mode="before")
    @classmethod
    def limpiar_descripcion(cls, descripcion):
        return descripcion.strip() if isinstance(descripcion, str) else descripcion
