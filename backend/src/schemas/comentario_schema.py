from pydantic import BaseModel, Field, field_validator


class UpdateComentarioSchema(BaseModel):
    texto: str = Field(min_length=1)

    @field_validator("texto", mode="before")
    @classmethod
    def limpiar_texto(cls, texto):
        if isinstance(texto, str):
            return texto.strip()
        return texto


class CreateComentarioSchema(UpdateComentarioSchema):
    post_id: int = Field(gt=0)
    autor_id: int = Field(gt=0)
    comentario_padre_id: int | None = Field(default=None, gt=0)