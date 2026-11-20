from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UpdateReporteDTO(BaseModel):
    motivo: str


class CreateReporteDTO(UpdateReporteDTO):
    usuario_id: int
    post_id: int


class ReporteResponseDTO(CreateReporteDTO):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fecha: datetime
