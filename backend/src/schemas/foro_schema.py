from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, PositiveInt, StringConstraints
from typing import Annotated


class Actor(BaseModel):
    usuario_id: PositiveInt


class MembershipAction(Actor):
    accion: Literal["unir", "salir", "promover", "banear"]
    miembro_id: PositiveInt | None = None
    motivo: str = Field(default="", max_length=255)
    hasta: datetime | None = None


class CommentVote(Actor):
    valor: Literal[-1, 0, 1]


class PostAction(Actor):
    accion: Literal["guardar", "quitar", "reportar", "ocultar", "mostrar"]
    motivo: str = Field(default="", max_length=255)


class CreateQuestion(BaseModel):
    titulo: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=300)]
    contenido: str = Field(default="", max_length=5000)
    opinar_primero: bool = False


class CreateAnswer(BaseModel):
    texto: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=3000)]
