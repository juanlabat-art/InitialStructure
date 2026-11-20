from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class VotarPostDTO(BaseModel):
    usuario_id: int
    post_id: int
    valor: Literal[1, -1]


class VotoPostResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    usuario_id: int
    post_id: int
    valor: Literal[1, -1]
    fecha: datetime


class PuntajePostResponseDTO(BaseModel):
    post_id: int
    positivos: int
    negativos: int
    puntaje: int