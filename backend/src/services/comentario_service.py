from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.db.models.comentario_model import Comentario
from src.db.models.foro_model import comment_reports, notifications
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario
from src.dtos.comentario_dto import (
    ComentarioResponseDTO,
    CreateComentarioDTO,
    UpdateComentarioDTO,
)
from src.mappers.comentario_mapper import to_comentario_response
from src.repositories.comentario_repository import ComentarioRepository
from src.repositories.usuario_repository import UsuarioRepository
from src.services.foro_service import ForumService
from src.services.karma_service import actualizar_karma


class ComentarioService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ComentarioRepository(db)
        self.usuarios = UsuarioRepository(db)

    def create(
        self,
        dto: CreateComentarioDTO,
    ) -> ComentarioResponseDTO:
        post = self._buscar_post_visible(dto.post_id)
        forum = ForumService(self.db)
        forum.require_member(post.comunidad_id, dto.autor_id)
        post = self._buscar_post_visible(dto.post_id, bloquear=True)
        if post.eliminado:
            raise HTTPException(409, "La publicación está eliminada")

        if self.usuarios.find_by_id(dto.autor_id) is None:
            raise HTTPException(
                status_code=404,
                detail="El autor no existe",
            )

        destinatarios = {post.autor_id: False}
        if dto.comentario_padre_id is not None:
            forum.require_visible_comments(dto.post_id, dto.autor_id)
            padre = self._validar_padre(
                dto.comentario_padre_id,
                dto.post_id,
            )
            if padre.eliminado:
                raise HTTPException(409, "El comentario está eliminado")
            destinatarios[padre.autor_id] = True
        destinatarios.pop(dto.autor_id, None)

        try:
            comentario = self.repo.create(dto)
            if destinatarios:
                self.db.execute(notifications.insert(), [
                    {"usuario_id": usuario_id, "comentario_id": comentario.id, "es_respuesta": es_respuesta}
                    for usuario_id, es_respuesta in destinatarios.items()
                ])
            respuesta = to_comentario_response(comentario)
            self.db.commit()
        except IntegrityError as error:
            self.db.rollback()

            if self._codigo_postgres(error) == "23503":
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "El post, el autor o el comentario padre "
                        "dejaron de estar disponibles"
                    ),
                ) from error

            raise

        return respuesta

    def get_by_id(
        self,
        comentario_id: int,
        usuario_id: int | None = None,
    ) -> ComentarioResponseDTO:
        comentario = self._buscar_comentario(comentario_id)
        self._buscar_post_visible(comentario.post_id)
        ForumService(self.db).require_visible_comments(comentario.post_id, usuario_id)
        return to_comentario_response(comentario)

    def list_by_post(
        self,
        post_id: int,
        usuario_id: int | None = None,
    ) -> list[ComentarioResponseDTO]:
        self._buscar_post_visible(post_id)
        ForumService(self.db).require_visible_comments(post_id, usuario_id)
        comentarios = self.repo.list_by_post(post_id)

        return [
            to_comentario_response(comentario)
            for comentario in comentarios
        ]

    def update(
        self,
        comentario_id: int,
        dto: UpdateComentarioDTO,
        actor: int,
    ) -> ComentarioResponseDTO:
        comentario = self.db.get(Comentario, comentario_id, with_for_update=True)
        if comentario is None:
            raise HTTPException(404, "El comentario no existe")
        if comentario.autor_id != actor:
            raise HTTPException(403, "No tenés permiso para realizar esta acción")
        self._buscar_post_visible(comentario.post_id)

        if comentario.eliminado:
            raise HTTPException(
                status_code=409,
                detail="El comentario está eliminado",
            )

        actualizado = self.repo.update(comentario, dto)
        return to_comentario_response(actualizado)

    def delete(self, comentario_id: int, actor: int, *, moderacion_sitio: bool = False) -> None:
        comentario = self.db.get(Comentario, comentario_id, with_for_update=True)
        if comentario is None:
            raise HTTPException(404, "El comentario no existe")
        if comentario.autor_id != actor and not moderacion_sitio:
            raise HTTPException(403, "No tenés permiso para realizar esta acción")
        if comentario.eliminado:
            return
        autor = self.db.get(Usuario, comentario.autor_id, with_for_update=True)
        self.repo.mark_deleted(comentario)
        actualizar_karma(self.db, autor)
        self.db.commit()

    def reportar(self, comentario_id: int, actor: int, motivo: str) -> None:
        comentario = self.db.get(Comentario, comentario_id, with_for_update=True)
        if comentario is None or comentario.eliminado:
            raise HTTPException(404, "El comentario no está disponible")
        if comentario.autor_id == actor:
            raise HTTPException(403, "No podés reportar tu propio comentario")
        self._buscar_post_visible(comentario.post_id)
        ForumService(self.db).require_visible_comments(comentario.post_id, actor)
        try:
            self.db.execute(comment_reports.insert().values(
                comentario_id=comentario_id, usuario_id=actor, motivo=motivo,
            ))
            self.db.commit()
        except IntegrityError as error:
            self.db.rollback()
            raise HTTPException(409, "Ya reportaste este comentario") from error

    def _buscar_comentario(
        self,
        comentario_id: int,
    ) -> Comentario:
        comentario = self.repo.find_by_id(comentario_id)

        if comentario is None:
            raise HTTPException(
                status_code=404,
                detail="El comentario no existe",
            )

        return comentario

    def _buscar_post_visible(self, post_id: int, *, bloquear: bool = False) -> Post:
        post = self.db.get(Post, post_id, with_for_update=bloquear, populate_existing=bloquear)

        if post is None or post.oculto:
            raise HTTPException(
                status_code=404,
                detail="El post no existe o está oculto",
            )

        return post

    def _validar_padre(
        self,
        comentario_padre_id: int,
        post_id: int,
    ) -> Comentario:
        padre = self.db.get(Comentario, comentario_padre_id, with_for_update=True)
        if padre is None:
            raise HTTPException(404, "El comentario no existe")
        actual = padre
        nivel_nuevo = 1
        visitados = set()

        while True:
            if actual.id in visitados:
                raise HTTPException(
                    status_code=409,
                    detail="La cadena de comentarios tiene un ciclo",
                )

            visitados.add(actual.id)

            if actual.post_id != post_id:
                raise HTTPException(
                    status_code=400,
                    detail="El comentario padre pertenece a otro post",
                )

            nivel_nuevo += 1

            if nivel_nuevo > 10:
                raise HTTPException(
                    status_code=400,
                    detail="Se permiten hasta 10 niveles de comentarios",
                )

            if actual.comentario_padre_id is None:
                break

            actual = self._buscar_comentario(
                actual.comentario_padre_id
            )

        return padre

    @staticmethod
    def _codigo_postgres(error: IntegrityError) -> str | None:
        return (
            getattr(error.orig, "sqlstate", None)
            or getattr(error.orig, "pgcode", None)
        )
