from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints


MotivoBan = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]


class UpdateBanSchema(BaseModel):
    motivo: MotivoBan | None
    fecha_hasta: datetime | None


class CreateBanSchema(UpdateBanSchema):
    comunidad_id: int = Field(gt=0)
    usuario_id: int = Field(gt=0)
    moderador_id: int = Field(gt=0)
    motivo: MotivoBan | None = None
    fecha_hasta: datetime | None = None
