from pydantic import BaseModel

from src.utils.fechas import FechaUTC


class CreateUsuarioDTO(BaseModel):
    username: str
    email: str


class UsuarioResponseDTO(BaseModel):
    id: int
    username: str
    email: str
    karma: int
    fecha_registro: FechaUTC

    model_config = {"from_attributes": True}
