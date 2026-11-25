from pydantic import BaseModel, ConfigDict

from src.utils.fechas import FechaUTC


class UpdateComentarioDTO(BaseModel):
    texto: str


class CreateComentarioDTO(UpdateComentarioDTO):
    post_id: int
    autor_id: int
    comentario_padre_id: int | None = None


class ComentarioResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    autor_id: int
    comentario_padre_id: int | None
    texto: str
    fecha: FechaUTC
    eliminado: bool
