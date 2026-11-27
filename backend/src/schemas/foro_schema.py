from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, PositiveInt, StringConstraints, model_validator
from typing import Annotated

from src.db.models.foro_model import CategoriaAnonima


class Actor(BaseModel):
    usuario_id: PositiveInt


class MembershipAction(Actor):
    accion: Literal["unir", "salir", "promover", "banear", "fijar", "desfijar"]
    miembro_id: PositiveInt | None = None
    motivo: str = Field(default="", max_length=255)
    hasta: datetime | None = None


class CommentVote(Actor):
    valor: Literal[-1, 1]


class LeerNotificaciones(BaseModel):
    comentario_ids: list[PositiveInt] = Field(default_factory=list)
    post_ids: list[PositiveInt] = Field(default_factory=list)

    @model_validator(mode="after")
    def validar_notificaciones(self):
        if not self.comentario_ids and not self.post_ids:
            raise ValueError("Indicá las notificaciones leídas")
        return self


class PostAction(Actor):
    accion: Literal["guardar", "quitar", "reportar", "ocultar", "mostrar"]
    motivo: str = Field(default="", max_length=255)


class CreateQuestion(BaseModel):
    titulo: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=300)]
    contenido: str = Field(default="", max_length=5000)
    opinar_primero: bool = False
    categoria: CategoriaAnonima = CategoriaAnonima.GENERAL


class CreateAnswer(BaseModel):
    texto: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=3000)]
