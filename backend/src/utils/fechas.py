from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator


def fecha_utc(fecha: datetime) -> datetime:
    if fecha.tzinfo is None:
        return fecha.replace(tzinfo=timezone.utc)
    return fecha.astimezone(timezone.utc)


FechaUTC = Annotated[datetime, AfterValidator(fecha_utc)]
