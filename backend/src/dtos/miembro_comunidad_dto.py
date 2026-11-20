from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class UpdateMiembroComunidadDTO(BaseModel):
    rol: Literal["miembro", "moderador"]


class CreateMiembroComunidadDTO(UpdateMiembroComunidadDTO):
    usuario_id: int
    comunidad_id: int
    rol: Literal["miembro", "moderador"] = "miembro"


class MiembroComunidadResponseDTO(CreateMiembroComunidadDTO):
    model_config = ConfigDict(from_attributes=True)

    fecha_union: datetime
