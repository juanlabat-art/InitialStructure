from typing import Literal

from pydantic import BaseModel, Field


class VotarPostSchema(BaseModel):
    usuario_id: int = Field(gt=0)
    post_id: int = Field(gt=0)
    valor: Literal[1, -1]