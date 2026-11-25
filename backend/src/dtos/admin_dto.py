from typing import Literal

from pydantic import BaseModel

from src.dtos.foro_dto import RolSitio


SeccionModerable = Literal["posts", "comentarios", "preguntas", "respuestas"]
SeccionAdmin = Literal[SeccionModerable, "subadmins", "usuarios"]


class EntradaAdminDTO(BaseModel):
    id: int
    texto: str
    detalle: str | None = None
    resumen: str | None = None
    reportes: int | None = None
    oculto: bool | None = None
    rol_sitio: RolSitio | None = None


class PaginaAdminDTO(BaseModel):
    entradas: list[EntradaAdminDTO]
    siguiente: bool


class CambioRolSitio(BaseModel):
    rol: Literal["usuario", "subadmin"]


class VisibilidadPost(BaseModel):
    oculto: bool
