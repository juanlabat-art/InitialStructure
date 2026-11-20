from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.db.models.comunidad_model import Comunidad
from src.dtos.comunidad_dto import (
    ComunidadResponseDTO,
    CreateComunidadDTO,
    UpdateComunidadDTO,
)
from src.mappers.comunidad_mapper import to_comunidad_response
from src.repositories.comunidad_repository import ComunidadRepository
from src.repositories.usuario_repository import UsuarioRepository
from src.services.foro_service import ForumService


class ComunidadService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ComunidadRepository(db)
        self.usuarios = UsuarioRepository(db)

    def create(self, dto: CreateComunidadDTO) -> ComunidadResponseDTO:
        creator = self.usuarios.find_by_id(dto.creador_id)
        if creator is None:
            raise HTTPException(status_code=404, detail="El usuario creador no existe")

        if creator.karma < 10:
            raise HTTPException(status_code=403, detail="Necesitás 10 de karma para crear una comunidad")

        try:
            comunidad = self.repo.create(dto)
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

        try:
            comunidad = self.repo.update(comunidad, dto)
        except IntegrityError as error:
            self.db.rollback()
            if self._codigo_integridad(error) in {"23505", "SQLITE_CONSTRAINT_UNIQUE"}:
                raise HTTPException(status_code=409, detail="Ese nombre ya está en uso") from error
            raise

        return to_comunidad_response(comunidad)

    def delete(self, comunidad_id: int, actor: int) -> None:
        comunidad = self._buscar_comunidad(comunidad_id)
        if comunidad.creador_id != actor:
            raise HTTPException(403, "Solo la cuenta creadora puede eliminar esta comunidad")

        try:
            self.repo.delete(comunidad)
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