from sqlalchemy.orm import Session

from src.db.models.miembro_comunidad_model import MiembroComunidad
from src.dtos.miembro_comunidad_dto import (
    CreateMiembroComunidadDTO,
    MiembroComunidadResponseDTO,
    UpdateMiembroComunidadDTO,
)
from src.mappers.miembro_comunidad_mapper import to_miembro_comunidad_response
from src.repositories.comunidad_repository import ComunidadRepository
from src.repositories.miembro_comunidad_repository import MiembroComunidadRepository
from src.repositories.usuario_repository import UsuarioRepository
from src.utils.errors import NotFoundError


class MiembroComunidadService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = MiembroComunidadRepository(db)
        self.comunidades = ComunidadRepository(db)
        self.usuarios = UsuarioRepository(db)

    def create(self, dto: CreateMiembroComunidadDTO) -> MiembroComunidadResponseDTO:
        with self.db.begin():
            self._validar_comunidad(dto.comunidad_id)
            if self.usuarios.find_by_id(dto.usuario_id) is None:
                raise NotFoundError("El usuario no existe")
            return to_miembro_comunidad_response(self.repo.create(dto))

    def get(self, comunidad_id: int, usuario_id: int) -> MiembroComunidadResponseDTO:
        return to_miembro_comunidad_response(self._buscar(comunidad_id, usuario_id))

    def list_by_comunidad(self, comunidad_id: int) -> list[MiembroComunidadResponseDTO]:
        self._validar_comunidad(comunidad_id)
        return [
            to_miembro_comunidad_response(miembro)
            for miembro in self.repo.list_by_comunidad(comunidad_id)
        ]

    def update(
        self, comunidad_id: int, usuario_id: int, dto: UpdateMiembroComunidadDTO
    ) -> MiembroComunidadResponseDTO:
        with self.db.begin():
            miembro = self._buscar(comunidad_id, usuario_id, bloquear=True)
            return to_miembro_comunidad_response(self.repo.update(miembro, dto))

    def delete(self, comunidad_id: int, usuario_id: int) -> None:
        with self.db.begin():
            self.repo.delete(self._buscar(comunidad_id, usuario_id, bloquear=True))

    def _buscar(
        self, comunidad_id: int, usuario_id: int, bloquear: bool = False
    ) -> MiembroComunidad:
        miembro = self.repo.find(usuario_id, comunidad_id, bloquear)
        if miembro is None:
            raise NotFoundError("El usuario no es miembro de la comunidad")
        return miembro

    def _validar_comunidad(self, comunidad_id: int) -> None:
        if self.comunidades.find_by_id(comunidad_id) is None:
            raise NotFoundError("La comunidad no existe")
