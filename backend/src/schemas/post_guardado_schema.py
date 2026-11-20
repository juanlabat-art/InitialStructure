from pydantic import BaseModel, Field


class GuardarPostSchema(BaseModel):
    usuario_id: int = Field(gt=0)
    post_id: int = Field(gt=0)
