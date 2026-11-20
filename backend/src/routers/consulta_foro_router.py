from typing import Literal

from fastapi import APIRouter, Depends

from src.db.connection import get_db
from src.db.models.comunidad_model import Comunidad
from src.dtos.consulta_foro_dto import (
    ComentarioArbolDTO,
    KarmaDTO,
    PerfilDTO,
    PostConPuntajeDTO,
    PostGuardadoDetalleDTO,
    PostReportadoDTO,
    UsuarioRankingDTO,
)
from src.services.consulta_foro_service import ConsultaForoService
from src.services.sesion_service import sesion_actual, usuario_actual, verificar_actor


router = APIRouter(tags=["consultas del foro"])


@router.get("/usuarios/{username}", response_model=PerfilDTO)
def perfil(username: str, db=Depends(get_db)):
    return ConsultaForoService(db).perfil(username)


@router.get("/usuarios/{usuario_id}/karma", response_model=KarmaDTO)
def karma(usuario_id: int, db=Depends(get_db)):
    return ConsultaForoService(db).karma(usuario_id)


@router.get("/posts/{post_id}/comentarios", response_model=list[ComentarioArbolDTO])
def comentarios(post_id: int, actor=Depends(sesion_actual), db=Depends(get_db)):
    return ConsultaForoService(db).comentarios(post_id, actor)


@router.get("/comunidades/{comunidad_id}/posts", response_model=list[PostConPuntajeDTO])
def posts(comunidad_id: int, orden: Literal["hot", "nuevo", "top"] = "hot",
          periodo: Literal["semana"] | None = None, db=Depends(get_db)):
    consulta = ConsultaForoService(db)
    consulta.entidad(Comunidad, comunidad_id)
    return consulta.posts([comunidad_id], orden, periodo)


@router.get("/usuarios/{usuario_id}/feed", response_model=list[PostConPuntajeDTO])
def feed(usuario_id: int, db=Depends(get_db)):
    return ConsultaForoService(db).feed(usuario_id)


@router.get("/comunidades/{comunidad_id}/reportes", response_model=list[PostReportadoDTO])
def reportes(comunidad_id: int, actor=Depends(usuario_actual), db=Depends(get_db)):
    return ConsultaForoService(db).reportes(comunidad_id, actor)


@router.get("/usuarios/{usuario_id}/guardados", response_model=list[PostGuardadoDetalleDTO])
def guardados(usuario_id: int, actor=Depends(usuario_actual), db=Depends(get_db)):
    verificar_actor(actor, usuario_id)
    return ConsultaForoService(db).guardados(usuario_id)


@router.get("/comunidades/{comunidad_id}/top-usuarios", response_model=list[UsuarioRankingDTO])
def ranking(comunidad_id: int, db=Depends(get_db)):
    return ConsultaForoService(db).ranking(comunidad_id)
