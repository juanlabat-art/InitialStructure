from typing import Literal

from pydantic import BaseModel, Field, field_validator


class VotarComentarioSchema(BaseModel):
    usuario_id: int = Field(gt=0)
    comentario_id: int = Field(gt=0)
    valor: Literal[1, -1]

    @field_validator("valor", mode="before")
    @classmethod
    def validar_entero(cls, valor: object) -> object:
        if type(valor) is not int:
            raise ValueError("El valor del voto debe ser 1 o -1")
        return valor
