from pydantic import BaseModel, ConfigDict

from src.utils.fechas import FechaUTC


class UpdatePostDTO(BaseModel):
    titulo: str
    contenido: str | None = None


class CreatePostDTO(UpdatePostDTO):
    es_pregunta: bool = False
    opinar_primero: bool = False
    comunidad_id: int
    autor_id: int
    solicitud_id: str | None = None


class PostResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    comunidad_id: int
    autor_id: int
    titulo: str
    contenido: str | None
    fecha: FechaUTC
    fecha_edicion: FechaUTC | None = None
    oculto: bool
    eliminado: bool = False
    es_pregunta: bool
    opinar_primero: bool
