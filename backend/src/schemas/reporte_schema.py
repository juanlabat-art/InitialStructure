from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints


class UpdateReporteSchema(BaseModel):
    motivo: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]


class CreateReporteSchema(UpdateReporteSchema):
    usuario_id: int = Field(gt=0)
    post_id: int = Field(gt=0)
