from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from src.db.models.comentario_model import Comentario
from src.db.models.foro_model import comment_votes, reports, saved
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario
from src.db.models.voto_post_model import VotoPost
from src.dtos.post_dto import CreatePostDTO, UpdatePostDTO
from src.services.karma_service import actualizar_karma


class PostRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, dto: CreatePostDTO) -> Post:
        post = Post(
            comunidad_id=dto.comunidad_id,
            autor_id=dto.autor_id,
            solicitud_id=dto.solicitud_id,
            titulo=dto.titulo,
            contenido=dto.contenido,
            es_pregunta=dto.es_pregunta,
            opinar_primero=dto.es_pregunta and dto.opinar_primero,
        )
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return post

    def find_by_id(self, post_id: int) -> Post | None:
        return self.db.get(Post, post_id)

    def find_by_request(self, dto: CreatePostDTO) -> Post | None:
        if dto.solicitud_id is None:
            return None
        return self.db.scalar(select(Post).where(
            Post.autor_id == dto.autor_id, Post.solicitud_id == dto.solicitud_id,
        ))

    def list_all(self, comunidad_id: int | None = None) -> list[Post]:
        consulta = self.db.query(Post).filter(Post.oculto.is_(False))
        if comunidad_id is not None:
            consulta = consulta.filter(Post.comunidad_id == comunidad_id)
        return consulta.order_by(Post.fecha.desc(), Post.id.desc()).all()

    def update(self, post: Post, dto: UpdatePostDTO) -> Post:
        if post.titulo == dto.titulo and (post.contenido or "") == (dto.contenido or ""):
            return post
        post.titulo = dto.titulo
        post.contenido = dto.contenido
        post.fecha_edicion = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(post)
        return post

    def mark_deleted(self, post: Post) -> None:
        if post.eliminado:
            return
        post.eliminado = True
        post.oculto = False
        post.titulo = "Publicación eliminada"
        post.contenido = None
        post.es_pregunta = False
        post.opinar_primero = False
        post.fecha_edicion = None
        for table in (VotoPost.__table__, saved):
            self.db.execute(delete(table).where(table.c.post_id == post.id))
        autor = self.db.get(Usuario, post.autor_id, with_for_update=True)
        actualizar_karma(self.db, autor)

    def delete_owned(self, scope, actor: int) -> None:
        posts = self.db.scalars(select(Post).where(scope).order_by(Post.id).with_for_update()).all()
        if not posts:
            return
        if any(post.autor_id != actor for post in posts):
            raise HTTPException(409, "La comunidad contiene publicaciones de otras cuentas")

        post_ids = [post.id for post in posts]
        comments = self.db.scalars(select(Comentario).where(
            Comentario.post_id.in_(post_ids),
        ).order_by(Comentario.id).with_for_update()).all()
        if any(comment.autor_id != actor and not comment.eliminado for comment in comments):
            raise HTTPException(409, "Todavía hay comentarios de otras cuentas. Sus autores deben eliminarlos primero.")

        author_ids = {post.autor_id for post in posts} | {comment.autor_id for comment in comments}
        authors = self.db.scalars(select(Usuario).where(
            Usuario.id.in_(author_ids),
        ).order_by(Usuario.id).with_for_update()).all()
        self.db.execute(delete(comment_votes).where(
            comment_votes.c.comentario_id.in_([comment.id for comment in comments]),
        ))
        self.db.execute(delete(Comentario).where(Comentario.post_id.in_(post_ids)))
        for table in (VotoPost.__table__, reports, saved):
            self.db.execute(delete(table).where(table.c.post_id.in_(post_ids)))
        self.db.execute(delete(Post).where(Post.id.in_(post_ids)))
        for author in authors:
            actualizar_karma(self.db, author)
