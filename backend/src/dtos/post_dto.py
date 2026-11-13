from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UpdatePostDTO(BaseModel):
    titulo: str
    contenido: str | None = None


class CreatePostDTO(UpdatePostDTO):
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