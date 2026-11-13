from pydantic import BaseModel, Field


class UpdateComunidadSchema(BaseModel):
    nombre: str = Field(min_length=3, max_length=21, pattern=r"^\S+$")
    descripcion: str | None = None
    es_nsfw: bool = False


class CreateComunidadSchema(UpdateComunidadSchema):
    creador_id: int = Field(gt=0)