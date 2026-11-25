from typing import Literal

from pydantic import BaseModel, ConfigDict

from src.db.models.foro_model import CategoriaAnonima
from src.dtos.comentario_dto import ComentarioResponseDTO
from src.dtos.comunidad_dto import ComunidadResponseDTO
from src.dtos.post_dto import PostResponseDTO
from src.dtos.voto_post_dto import VotoPostResponseDTO
from src.utils.fechas import FechaUTC

RolSitio = Literal["usuario", "subadmin", "admin"]


class UsuarioForoDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    karma: int
    fecha_registro: FechaUTC
    descripcion: str | None = None
    foto_version: str | None = None
    perfil_visible: bool = False
    rol_sitio: RolSitio = "usuario"


class PreguntaAnonimaDTO(BaseModel):
    id: int
    titulo: str
    contenido: str
    opinar_primero: bool
    fecha: FechaUTC
    categoria: CategoriaAnonima
    propia: bool


class RespuestaAnonimaDTO(BaseModel):
    id: int
    pregunta_id: int
    texto: str
    fecha: FechaUTC
    propia: bool


class NotificacionForoDTO(BaseModel):
    tipo: Literal["comentario", "reportes"] = "comentario"
    comentario_id: int | None = None
    post_id: int
    autor: str | None = None
    titulo: str
    es_respuesta: bool = False
    leida: bool
    fecha: FechaUTC


class ForoDTO(BaseModel):
    usuario_actual_id: int | None
    rol_sitio_actual: RolSitio | None = None
    votos_para_proximo_karma: int | None
    usuarios: list[UsuarioForoDTO]
    comunidades: list[ComunidadResponseDTO]
    posts: list[PostResponseDTO]
    comentarios: list[ComentarioResponseDTO]
    puntajes: dict[int, int]
    votos: list[VotoPostResponseDTO]
    membresias: list[dict]
    guardados: list[dict]
    reportes: list[dict]
    comentarios_reportados: list[int]
    baneos: list[dict]
    votos_comentarios: list[dict]
    puntajes_comentarios: dict[int, int]
    preguntas: list[PreguntaAnonimaDTO]
    respuestas: list[RespuestaAnonimaDTO]
    preguntas_desbloqueadas: list[int]
