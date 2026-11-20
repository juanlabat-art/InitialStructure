from sqlalchemy.orm import Session

from src.db.models.ban_model import Ban
from src.dtos.ban_dto import BanResponseDTO, CreateBanDTO, UpdateBanDTO
from src.mappers.ban_mapper import to_ban_response
from src.repositories.ban_repository import BanRepository
from src.repositories.comunidad_repository import ComunidadRepository
from src.repositories.usuario_repository import UsuarioRepository
from src.utils.errors import NotFoundError


class BanService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = BanRepository(db)
        self.comunidades = ComunidadRepository(db)
        self.usuarios = UsuarioRepository(db)

    def create(self, dto: CreateBanDTO) -> BanResponseDTO:
        with self.db.begin():
            if self.comunidades.find_by_id(dto.comunidad_id) is None:
                raise NotFoundError("La comunidad no existe")
            if self.usuarios.find_by_id(dto.usuario_id) is None:
                raise NotFoundError("El usuario no existe")
            if self.usuarios.find_by_id(dto.moderador_id) is None:
                raise NotFoundError("El moderador no existe")
            return to_ban_response(self.repo.create(dto))

    def get_by_id(self, ban_id: int) -> BanResponseDTO:
        return to_ban_response(self._buscar(ban_id))

    def list_all(
        self, comunidad_id: int | None = None, usuario_id: int | None = None
    ) -> list[BanResponseDTO]:
        return [to_ban_response(ban) for ban in self.repo.list_all(comunidad_id, usuario_id)]

    def update(self, ban_id: int, dto: UpdateBanDTO) -> BanResponseDTO:
        with self.db.begin():
            ban = self._buscar(ban_id, bloquear=True)
            return to_ban_response(self.repo.update(ban, dto))

    def delete(self, ban_id: int) -> None:
        with self.db.begin():
            self.repo.delete(self._buscar(ban_id, bloquear=True))

    def _buscar(self, ban_id: int, bloquear: bool = False) -> Ban:
        ban = self.repo.find_by_id(ban_id, bloquear)
        if ban is None:
            raise NotFoundError("El ban no existe")
        return ban
