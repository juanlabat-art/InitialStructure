from pydantic import BaseModel, EmailStr, Field


class CreateUsuarioSchema(BaseModel):
    username: str = Field(max_length=30)
    email: EmailStr


class UpdateUsuarioSchema(BaseModel):
    # TODO: completar con los campos opcionales que se permiten actualizar.
    # Tip: todos los campos van como Optional / con default None.
    ...
