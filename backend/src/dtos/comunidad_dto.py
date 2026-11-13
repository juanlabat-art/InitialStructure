from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UpdateComunidadDTO(BaseModel):
    nombre: str
    descripcion: str | None = None
    es_nsfw: bool = False


class CreateComunidadDTO(UpdateComunidadDTO):
    creador_id: int


class ComunidadResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None
    creador_id: int
    es_nsfw: bool
    fecha_creacion: datetime