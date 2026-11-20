from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.dtos.comentario_dto import ComentarioResponseDTO
from src.dtos.comunidad_dto import ComunidadResponseDTO
from src.dtos.post_dto import PostResponseDTO
from src.dtos.voto_post_dto import VotoPostResponseDTO


class UsuarioForoDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    karma: int
    fecha_registro: datetime


class ForoDTO(BaseModel):
    usuarios: list[UsuarioForoDTO]
    comunidades: list[ComunidadResponseDTO]
    posts: list[PostResponseDTO]
    comentarios: list[ComentarioResponseDTO]
    puntajes: dict[int, int]
    votos: list[VotoPostResponseDTO]
    membresias: list[dict]
    guardados: list[dict]
    reportes: list[dict]
    baneos: list[dict]
    votos_comentarios: list[dict]
    puntajes_comentarios: dict[int, int]
    preguntas: list[dict]
    respuestas: list[dict]
    preguntas_desbloqueadas: list[int]
