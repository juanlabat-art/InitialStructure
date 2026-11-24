from fastapi import HTTPException
from sqlalchemy import delete, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.db.models.comentario_model import Comentario
from src.db.models.comunidad_model import Comunidad
from src.db.models.foro_model import bans, comment_votes, memberships, reports, saved
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario, sesiones
from src.db.models.voto_post_model import VotoPost
from src.repositories.comentario_repository import ComentarioRepository
from src.repositories.comunidad_repository import ComunidadRepository
from src.repositories.post_repository import PostRepository
from src.repositories.usuario_repository import UsuarioRepository
from src.services.karma_service import actualizar_karma
from src.services.sesion_service import hash_clave, verificar_clave


class UsuarioService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UsuarioRepository(db)

    def create(self, username: str, email: str, clave: str) -> Usuario:
        username, email = username.lower(), email.lower()
        mensaje = "El nombre de usuario o email ya está en uso"
        if self.repo.exists_by_username_or_email(username, email):
            raise HTTPException(409, mensaje)
        try:
            return self.repo.create(username, email, hash_clave(clave))
        except IntegrityError as error:
            self.db.rollback()
            raise HTTPException(409, mensaje) from error

    def authenticate(self, username: str, clave: str) -> Usuario:
        usuario = self.repo.find_by_username(username.lower())
        if usuario is None or not verificar_clave(clave, usuario.clave_hash):
            raise HTTPException(401, "Nombre de usuario o contraseña incorrectos")
        return usuario

    def get_by_id(self, usuario_id: int) -> Usuario:
        usuario = self.repo.find_by_id(usuario_id)
        if usuario is None:
            raise HTTPException(404, "El usuario no existe")
        return usuario

    def eliminar_cuenta(self, usuario_id: int) -> None:
        try:
            self._eliminar_cuenta(usuario_id)
            self.db.commit()
        except IntegrityError as error:
            self.db.rollback()
            raise HTTPException(409, "La cuenta tiene registros asociados que impiden eliminarla") from error

    def _eliminar_cuenta(self, usuario_id: int) -> None:
        comunidades = self.db.scalars(select(Comunidad).where(
            Comunidad.creador_id == usuario_id,
        ).order_by(Comunidad.id).with_for_update()).all()
        comunidad_ids = [comunidad.id for comunidad in comunidades]
        PostRepository(self.db).delete_owned(
            or_(Post.autor_id == usuario_id, Post.comunidad_id.in_(comunidad_ids)),
            usuario_id,
        )
        comunidad_repo = ComunidadRepository(self.db)
        for comunidad in comunidades:
            comunidad_repo.delete(comunidad)

        comentarios = self.db.scalars(select(Comentario).where(
            Comentario.autor_id == usuario_id,
        ).order_by(Comentario.id).with_for_update()).all()
        comentario_repo = ComentarioRepository(self.db)
        for comentario in comentarios:
            comentario_repo.delete(comentario)

        autores_afectados = select(Post.autor_id).join(VotoPost).where(
            VotoPost.usuario_id == usuario_id,
        ).union(select(Comentario.autor_id).join(comment_votes).where(
            comment_votes.c.usuario_id == usuario_id,
        ))
        autores = self.db.scalars(select(Usuario).where(
            or_(Usuario.id == usuario_id, Usuario.id.in_(autores_afectados)),
        ).order_by(Usuario.id).with_for_update()).all()
        for tabla in (sesiones, memberships, reports, saved, VotoPost.__table__, comment_votes):
            self.db.execute(delete(tabla).where(tabla.c.usuario_id == usuario_id))
        self.db.execute(delete(bans).where(
            or_(bans.c.usuario_id == usuario_id, bans.c.moderador_id == usuario_id),
        ))
        self.db.execute(delete(Usuario).where(Usuario.id == usuario_id))
        for autor in autores:
            if autor.id != usuario_id:
                actualizar_karma(self.db, autor)

    def list_all(self) -> list[Usuario]:
        return self.repo.list_all()
