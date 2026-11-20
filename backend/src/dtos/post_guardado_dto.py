from datetime import datetime

from pydantic import BaseModel, ConfigDict


class GuardarPostDTO(BaseModel):
    usuario_id: int
    post_id: int


class PostGuardadoResponseDTO(GuardarPostDTO):
    model_config = ConfigDict(from_attributes=True)

    fecha: datetime
