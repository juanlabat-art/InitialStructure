from typing import Literal

from pydantic import BaseModel


class ConfirmarEliminacionSchema(BaseModel):
    confirmacion_inicial: Literal[True]
    confirmacion_final: Literal[True]
