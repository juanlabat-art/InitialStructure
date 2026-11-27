from base64 import b64decode

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.db.models.comunidad_model import Comunidad
from src.db.models.post_model import Post
from src.dtos.comunidad_dto import (
    ComunidadResponseDTO,
    CreateComunidadDTO,
    UpdateComunidadDTO,
)
from src.mappers.comunidad_mapper import to_comunidad_response
from src.repositories.comunidad_repository import ComunidadRepository
from src.repositories.post_repository import PostRepository
from src.repositories.usuario_repository import UsuarioRepository
from src.services.foto_service import MAX_BYTES, preparar_imagen
from src.services.foro_service import ForumService


class ComunidadService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ComunidadRepository(db)
        self.usuarios = UsuarioRepository(db)

    def create(self, dto: CreateComunidadDTO, banner: str | None = None) -> ComunidadResponseDTO:
        creator = self.usuarios.find_by_id(dto.creador_id)
        if creator is None:
            raise HTTPException(status_code=404, detail="El usuario creador no existe")

        if creator.karma < 10:
            raise HTTPException(status_code=403, detail="Necesitás 10 de karma para crear una comunidad")

        imagen = None
        if banner is not None:
            try:
                contenido = b64decode(banner, validate=True)
            except ValueError as error:
                raise HTTPException(422, "La foto del banner no es válida") from error
            if len(contenido) > MAX_BYTES:
                raise HTTPException(413, "La foto tiene que pesar como máximo 5 MB")
            imagen = preparar_imagen(contenido, banner=True)

        try:
            comunidad = self.repo.create(dto, imagen)
        except IntegrityError as error:
            self.db.rollback()
            codigo = self._codigo_integridad(error)
            if codigo in {"23505", "SQLITE_CONSTRAINT_UNIQUE"}:
                raise HTTPException(status_code=409, detail="Ese nombre ya está en uso") from error
            if codigo in {"23503", "SQLITE_CONSTRAINT_FOREIGNKEY"}:
                raise HTTPException(status_code=404, detail="El usuario creador no existe") from error
            raise

        return to_comunidad_response(comunidad)

    def get_by_id(self, comunidad_id: int) -> ComunidadResponseDTO:
        return to_comunidad_response(self._buscar_comunidad(comunidad_id))

    def list_all(self) -> list[ComunidadResponseDTO]:
        return [to_comunidad_response(comunidad) for comunidad in self.repo.list_all()]

    def update(self, comunidad_id: int, dto: UpdateComunidadDTO, actor: int) -> ComunidadResponseDTO:
        comunidad = self._buscar_comunidad(comunidad_id)
        if ForumService(self.db).role(comunidad.id, actor) != "moderador":
            raise HTTPException(403, "No tenés permiso para realizar esta acción")

        return to_comunidad_response(self.repo.update(comunidad, dto))

    def delete(self, comunidad_id: int, actor: int) -> None:
        comunidad = self.db.get(Comunidad, comunidad_id, with_for_update=True)
        if comunidad is None:
            raise HTTPException(404, "La comunidad no existe")
        if comunidad.creador_id != actor:
            raise HTTPException(403, "Solo la cuenta creadora puede eliminar esta comunidad")

        try:
            PostRepository(self.db).delete_owned(Post.comunidad_id == comunidad_id, actor)
            self.repo.delete(comunidad)
            self.db.commit()
        except IntegrityError as error:
            self.db.rollback()
            if self._codigo_integridad(error) in {"23503", "SQLITE_CONSTRAINT_FOREIGNKEY"}:
                raise HTTPException(
                    status_code=409,
                    detail="La comunidad tiene posts u otros registros asociados",
                ) from error
            raise

    def _buscar_comunidad(self, comunidad_id: int) -> Comunidad:
        comunidad = self.repo.find_by_id(comunidad_id)
        if comunidad is None:
            raise HTTPException(status_code=404, detail="La comunidad no existe")
        return comunidad

    @staticmethod
    def _codigo_integridad(error: IntegrityError) -> str | None:
        return (
            getattr(error.orig, "sqlstate", None)
            or getattr(error.orig, "pgcode", None)
            or getattr(error.orig, "sqlite_errorname", None)
        )
