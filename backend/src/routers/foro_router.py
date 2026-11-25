from typing import Annotated

from fastapi import APIRouter, Depends, Header
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.services.sesion_service import exigir_servidor_web, usuario_actual, verificar_actor
from src.db.models.comentario_model import Comentario
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario
from src.db.models.voto_post_model import VotoPost
from src.dtos.foro_dto import ForoDTO, NotificacionForoDTO, UsuarioForoDTO
from src.mappers.comentario_mapper import to_comentario_response
from src.mappers.post_mapper import to_post_response
from src.mappers.voto_post_mapper import to_voto_post_response
from src.schemas.foro_schema import CommentVote, CreateAnswer, CreateQuestion, LeerNotificaciones, MembershipAction, PostAction
from src.services.comunidad_service import ComunidadService
from src.services.foro_service import ForumService

router = APIRouter(prefix="/foro", tags=["foro"])
OptionalSessionHeader = Annotated[str | None, Header(alias="X-Punto-Session", min_length=16, max_length=128)]


@router.get("/", response_model=ForoDTO)
def leer_foro(session: OptionalSessionHeader = None, db: Session = Depends(get_db),
              usuario_id=Depends(usuario_actual)):
    forum = ForumService(db)
    visibility = forum.post_visibility(usuario_id)
    usuarios = db.scalars(select(Usuario).order_by(Usuario.id)).all()
    usuario_actual_foro = next((usuario for usuario in usuarios if usuario.id == usuario_id), None)
    posts = db.scalars(select(Post).where(visibility).order_by(Post.fecha.desc(), Post.id.desc()))
    comentarios = db.scalars(
        select(Comentario).join(Post, Comentario.post_id == Post.id)
        .where(visibility, forum.comment_visibility(usuario_id))
        .order_by(Comentario.fecha, Comentario.id)
    )
    puntajes = db.execute(
        select(VotoPost.post_id, func.sum(VotoPost.valor)).join(Post, Post.id == VotoPost.post_id)
        .where(VotoPost.usuario_id != Post.autor_id).group_by(VotoPost.post_id)
    )
    votos = db.scalars(select(VotoPost).join(Post, Post.id == VotoPost.post_id)
                      .where(VotoPost.usuario_id == usuario_id, VotoPost.usuario_id != Post.autor_id)) if usuario_id else []
    return ForoDTO(
        usuario_actual_id=usuario_id,
        rol_sitio_actual=usuario_actual_foro.rol_sitio if usuario_actual_foro else None,
        usuarios=[UsuarioForoDTO.model_validate(usuario) for usuario in usuarios],
        comunidades=ComunidadService(db).list_all(),
        posts=[to_post_response(post) for post in posts],
        comentarios=[to_comentario_response(comentario) for comentario in comentarios],
        puntajes=dict(puntajes.tuples().all()),
        votos=[to_voto_post_response(voto) for voto in votos],
        **forum.extra_data(usuario_id, session),
    )


@router.get("/notificaciones", response_model=list[NotificacionForoDTO])
def list_notifications(db: Session = Depends(get_db), actor: int = Depends(usuario_actual)):
    return ForumService(db).list_notifications(actor)


@router.put("/notificaciones", status_code=204)
def read_notifications(payload: LeerNotificaciones, db: Session = Depends(get_db),
                       actor: int = Depends(usuario_actual)):
    ForumService(db).read_notifications(actor, payload.comentario_ids, payload.post_ids)


@router.put("/comunidades/{community_id}/miembros", status_code=204)
def update_membership(community_id: int, payload: MembershipAction, db: Session = Depends(get_db),
                      actor=Depends(usuario_actual)):
    verificar_actor(actor, payload.usuario_id)
    ForumService(db).membership_action(community_id, payload)


@router.put("/posts/{post_id}", status_code=204)
def update_post(post_id: int, payload: PostAction, db: Session = Depends(get_db),
                      actor=Depends(usuario_actual)):
    verificar_actor(actor, payload.usuario_id)
    ForumService(db).post_action(post_id, payload)


@router.put(
    "/comentarios/{comment_id}/voto", status_code=204,
    dependencies=[Depends(exigir_servidor_web)], include_in_schema=False,
)
def comment_vote(comment_id: int, payload: CommentVote, db: Session = Depends(get_db),
                      actor=Depends(usuario_actual)):
    verificar_actor(actor, payload.usuario_id)
    ForumService(db).vote_comment(comment_id, actor, payload.valor)


@router.delete(
    "/comentarios/{comment_id}/voto", status_code=204,
    dependencies=[Depends(exigir_servidor_web)], include_in_schema=False,
)
def remove_comment_vote(comment_id: int, db: Session = Depends(get_db), actor=Depends(usuario_actual)):
    ForumService(db).vote_comment(comment_id, actor, 0)


@router.post("/anonimo", status_code=201)
def create_question(payload: CreateQuestion, actor=Depends(usuario_actual), db: Session = Depends(get_db)):
    return ForumService(db).create_question(actor, payload)


@router.post("/anonimo/{question_id}/respuestas", status_code=204)
def create_answer(question_id: int, payload: CreateAnswer, actor=Depends(usuario_actual), db: Session = Depends(get_db)):
    ForumService(db).create_answer(question_id, actor, payload)
