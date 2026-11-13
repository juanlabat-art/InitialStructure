from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.db.models.post_model import Post
from src.dtos.post_dto import CreatePostDTO, PostResponseDTO, UpdatePostDTO
from src.mappers.post_mapper import to_post_response
from src.repositories.comunidad_repository import ComunidadRepository
from src.repositories.post_repository import PostRepository
from src.repositories.usuario_repository import UsuarioRepository


class PostService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PostRepository(db)
        self.usuarios = UsuarioRepository(db)
        self.comunidades = ComunidadRepository(db)

    def create(self, dto: CreatePostDTO) -> PostResponseDTO:
        if self.usuarios.find_by_id(dto.autor_id) is None:
            raise HTTPException(status_code=404, detail="El autor no existe")

        if self.comunidades.find_by_id(dto.comunidad_id) is None:
            raise HTTPException(status_code=404, detail="La comunidad no existe")

        try:
            post = self.repo.create(dto)
        except IntegrityError as error:
            self.db.rollback()
            if self._codigo_postgres(error) == "23503":
                raise HTTPException(
                    status_code=409,
                    detail="El autor o la comunidad dejaron de estar disponibles",
                ) from error
            raise

        return to_post_response(post)

    def list_all(self, comunidad_id: int | None = None) -> list[PostResponseDTO]:
        return [to_post_response(post) for post in self.repo.list_all(comunidad_id)]

    def get_by_id(self, post_id: int) -> PostResponseDTO:
        return to_post_response(self._buscar_visible(post_id))

    def update(self, post_id: int, dto: UpdatePostDTO) -> PostResponseDTO:
        post = self._buscar_visible(post_id)
        return to_post_response(self.repo.update(post, dto))

    def delete(self, post_id: int) -> None:
        post = self._buscar_visible(post_id)
        try:
            self.repo.delete(post)
        except IntegrityError as error:
            self.db.rollback()
            if self._codigo_postgres(error) == "23503":
                raise HTTPException(
                    status_code=409,
                    detail="El post tiene comentarios u otros registros asociados",
                ) from error
            raise

    def _buscar_visible(self, post_id: int) -> Post:
        post = self.repo.find_by_id(post_id)
        if post is None or post.oculto:
            raise HTTPException(status_code=404, detail="El post no existe")
        return post

    @staticmethod
    def _codigo_postgres(error: IntegrityError) -> str | None:
        return getattr(error.orig, "sqlstate", None) or getattr(error.orig, "pgcode", None)