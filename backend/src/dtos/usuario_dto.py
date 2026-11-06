from datetime import datetime
from pydantic import BaseModel


class CreateUsuarioDTO(BaseModel):
    username: str
    email: str


class UsuarioResponseDTO(BaseModel):
    id: int
    username: str
    email: str
    karma: int
    fecha_registro: datetime

    model_config = {"from_attributes": True}
