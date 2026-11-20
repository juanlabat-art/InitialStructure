from typing import Literal

from pydantic import BaseModel, Field


class UpdateMiembroComunidadSchema(BaseModel):
    rol: Literal["miembro", "moderador"]


class CreateMiembroComunidadSchema(UpdateMiembroComunidadSchema):
    usuario_id: int = Field(gt=0)
    comunidad_id: int = Field(gt=0)
    rol: Literal["miembro", "moderador"] = "miembro"
