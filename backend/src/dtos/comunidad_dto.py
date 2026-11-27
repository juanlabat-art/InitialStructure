from pydantic import BaseModel, ConfigDict

from src.utils.fechas import FechaUTC


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
    fecha_creacion: FechaUTC
    foto_version: str | None = None
    banner_version: str | None = None
