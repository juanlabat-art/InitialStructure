from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class VotarComentarioDTO(BaseModel):
    usuario_id: int
    comentario_id: int
    valor: Literal[1, -1]


class VotoComentarioResponseDTO(VotarComentarioDTO):
    model_config = ConfigDict(from_attributes=True)

    fecha: datetime


class PuntajeComentarioResponseDTO(BaseModel):
    comentario_id: int
    positivos: int
    negativos: int
    puntaje: int
