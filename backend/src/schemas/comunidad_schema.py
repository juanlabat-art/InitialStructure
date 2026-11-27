from pydantic import BaseModel, ConfigDict, Field

from src.services.foto_service import MAX_BYTES


class UpdateComunidadSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    descripcion: str | None = Field(max_length=400)


class CreateComunidadSchema(BaseModel):
    nombre: str = Field(min_length=3, max_length=21, pattern=r"^\S+$")
    descripcion: str | None = None
    es_nsfw: bool = False
    creador_id: int = Field(gt=0)
    banner: str | None = Field(default=None, max_length=4 * ((MAX_BYTES + 2) // 3))
