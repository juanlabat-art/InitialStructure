from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.db.models.comentario_model import Comentario
from src.db.models.post_model import Post
from src.dtos.comentario_dto import (
    ComentarioResponseDTO,
    CreateComentarioDTO,
    UpdateComentarioDTO,
)
from src.mappers.comentario_mapper import to_comentario_response
from src.repositories.comentario_repository import ComentarioRepository
from src.repositories.post_repository import PostRepository
from src.repositories.usuario_repository import UsuarioRepository


class ComentarioService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ComentarioRepository(db)
        self.posts = PostRepository(db)
        self.usuarios = UsuarioRepository(db)

    def create(
        self,
        dto: CreateComentarioDTO,
    ) -> ComentarioResponseDTO:
        self._buscar_post_visible(dto.post_id)

        if self.usuarios.find_by_id(dto.autor_id) is None:
            raise HTTPException(
                status_code=404,
                detail="El autor no existe",
            )

        if dto.comentario_padre_id is not None:
            self._validar_padre(
                dto.comentario_padre_id,
                dto.post_id,
            )

        try:
            comentario = self.repo.create(dto)
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

        return to_comentario_response(comentario)

    def get_by_id(
        self,
        comentario_id: int,
    ) -> ComentarioResponseDTO:
        comentario = self._buscar_comentario(comentario_id)
        self._buscar_post_visible(comentario.post_id)
        return to_comentario_response(comentario)

    def list_by_post(
        self,
        post_id: int,
    ) -> list[ComentarioResponseDTO]:
        self._buscar_post_visible(post_id)
        comentarios = self.repo.list_by_post(post_id)

        return [
            to_comentario_response(comentario)
            for comentario in comentarios
        ]

    def update(
        self,
        comentario_id: int,
        dto: UpdateComentarioDTO,
    ) -> ComentarioResponseDTO:
        comentario = self._buscar_comentario(comentario_id)
        self._buscar_post_visible(comentario.post_id)

        if comentario.eliminado:
            raise HTTPException(
                status_code=409,
                detail="El comentario está eliminado",
            )

        actualizado = self.repo.update(comentario, dto)
        return to_comentario_response(actualizado)

    def delete(self, comentario_id: int) -> None:
        comentario = self._buscar_comentario(comentario_id)
        self._buscar_post_visible(comentario.post_id)
        self.repo.delete(comentario)

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

    def _buscar_post_visible(self, post_id: int) -> Post:
        post = self.posts.find_by_id(post_id)

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
    ) -> None:
        actual = self._buscar_comentario(comentario_padre_id)
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

    @staticmethod
    def _codigo_postgres(error: IntegrityError) -> str | None:
        return (
            getattr(error.orig, "sqlstate", None)
            or getattr(error.orig, "pgcode", None)
        )