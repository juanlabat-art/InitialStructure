from pydantic import BaseModel, Field, UUID4, field_validator


class UpdatePostSchema(BaseModel):
    titulo: str = Field(min_length=1, max_length=300)
    contenido: str | None = None

    @field_validator("titulo", mode="before")
    @classmethod
    def limpiar_titulo(cls, titulo):
        if isinstance(titulo, str):
            return titulo.strip()
        return titulo


class CreatePostSchema(UpdatePostSchema):
    es_pregunta: bool = False
    opinar_primero: bool = False
    comunidad_id: int = Field(gt=0)
    autor_id: int = Field(gt=0)
    solicitud_id: UUID4 | None = None
