from pydantic import BaseModel, Field, field_validator


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
    comunidad_id: int = Field(gt=0)
    autor_id: int = Field(gt=0)