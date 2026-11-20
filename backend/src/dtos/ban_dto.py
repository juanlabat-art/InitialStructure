from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, field_validator


class UpdateBanDTO(BaseModel):
    motivo: str | None
    fecha_hasta: datetime | None

    @field_validator("fecha_hasta")
    @classmethod
    def normalizar_fecha(cls, fecha: datetime | None) -> datetime | None:
        if fecha is not None and fecha.utcoffset() is not None:
            return fecha.astimezone(timezone.utc).replace(tzinfo=None)
        return fecha


class CreateBanDTO(UpdateBanDTO):
    comunidad_id: int
    usuario_id: int
    moderador_id: int
    motivo: str | None = None
    fecha_hasta: datetime | None = None


class BanResponseDTO(CreateBanDTO):
    model_config = ConfigDict(from_attributes=True)

    id: int
