from base64 import b64decode

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.db.models.post_model import Post
from src.dtos.post_dto import CreatePostDTO, PostResponseDTO, UpdatePostDTO
from src.mappers.post_mapper import to_post_response
from src.repositories.comunidad_repository import ComunidadRepository
from src.repositories.post_repository import PostRepository
from src.repositories.usuario_repository import UsuarioRepository
from src.services.foro_service import ForumService
from src.services.foto_service import MAX_BYTES, preparar_imagen


class PostService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PostRepository(db)
        self.usuarios = UsuarioRepository(db)
        self.comunidades = ComunidadRepository(db)

    def create(self, dto: CreatePostDTO, imagen: str | None = None) -> PostResponseDTO:
        existing = self.repo.find_by_request(dto)
        if existing is not None:
            return to_post_response(existing)

        if self.usuarios.find_by_id(dto.autor_id) is None:
            raise HTTPException(status_code=404, detail="El autor no existe")

        if self.comunidades.find_by_id(dto.comunidad_id) is None:
            raise HTTPException(status_code=404, detail="La comunidad no existe")

        ForumService(self.db).require_member(dto.comunidad_id, dto.autor_id)
        foto = None
        if imagen is not None:
            try:
                contenido = b64decode(imagen, validate=True)
            except ValueError as error:
                raise HTTPException(422, "La imagen no es válida") from error
            if len(contenido) > MAX_BYTES:
                raise HTTPException(413, "La imagen tiene que pesar como máximo 5 MB")
            foto = preparar_imagen(contenido, banner=True)

        try:
            post = self.repo.create(dto, foto)
        except IntegrityError as error:
            self.db.rollback()
            existing = self.repo.find_by_request(dto)
            if existing is not None:
                return to_post_response(existing)
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

    def update(self, post_id: int, dto: UpdatePostDTO, actor: int) -> PostResponseDTO:
        post = self._buscar_visible(post_id, bloquear=True)
        if post.autor_id != actor:
            raise HTTPException(403, "No tenés permiso para realizar esta acción")
        if post.eliminado:
            raise HTTPException(409, "La publicación está eliminada")
        return to_post_response(self.repo.update(post, dto))

    def delete(self, post_id: int, actor: int) -> None:
        post = self.db.get(Post, post_id, with_for_update=True)
        if post is None:
            raise HTTPException(404, "El post no existe")
        if post.autor_id != actor:
            raise HTTPException(403, "No tenés permiso para realizar esta acción")
        self.repo.mark_deleted(post)
        self.db.commit()

    def _buscar_visible(self, post_id: int, *, bloquear: bool = False) -> Post:
        post = self.db.get(Post, post_id, with_for_update=bloquear)
        if post is None or post.oculto:
            raise HTTPException(status_code=404, detail="El post no existe")
        return post

    @staticmethod
    def _codigo_postgres(error: IntegrityError) -> str | None:
        return getattr(error.orig, "sqlstate", None) or getattr(error.orig, "pgcode", None)
