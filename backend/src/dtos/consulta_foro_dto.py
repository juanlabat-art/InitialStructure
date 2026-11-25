from pydantic import BaseModel

from src.dtos.comentario_dto import ComentarioResponseDTO
from src.dtos.comunidad_dto import ComunidadResponseDTO
from src.dtos.foro_dto import UsuarioForoDTO
from src.dtos.post_dto import PostResponseDTO
from src.utils.fechas import FechaUTC


class PerfilDTO(UsuarioForoDTO):
    cantidad_posts: int
    comunidades: list[ComunidadResponseDTO]


class KarmaDTO(BaseModel):
    karma: int
    karma_por_nombramientos: int
    karma_posts: int
    karma_comentarios: int
    votos_positivos_posts: int
    votos_positivos_comentarios: int


class ComentarioArbolDTO(ComentarioResponseDTO):
    autor: UsuarioForoDTO
    puntaje: int
    respuestas: list["ComentarioArbolDTO"]


class PostConPuntajeDTO(PostResponseDTO):
    puntaje: int


class PostReportadoDTO(PostResponseDTO):
    cantidad_reportes: int


class PostGuardadoDetalleDTO(PostResponseDTO):
    fecha_guardado: FechaUTC


class UsuarioRankingDTO(BaseModel):
    id: int
    username: str
    karma: int
    votos_positivos: int
