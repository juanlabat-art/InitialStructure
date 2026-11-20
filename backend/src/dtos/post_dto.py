from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UpdatePostDTO(BaseModel):
    titulo: str
    contenido: str | None = None


class CreatePostDTO(UpdatePostDTO):
    es_pregunta: bool = False
    opinar_primero: bool = False
    comunidad_id: int
    autor_id: int


class PostResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    comunidad_id: int
    autor_id: int
    titulo: str
    contenido: str | None
    fecha: datetime
    oculto: bool
    es_pregunta: bool
    opinar_primero: bool