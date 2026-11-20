from sqlalchemy import select
from sqlalchemy.orm import Session

from src.db.models.ban_model import Ban
from src.dtos.ban_dto import CreateBanDTO, UpdateBanDTO


class BanRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, dto: CreateBanDTO) -> Ban:
        ban = Ban(**dto.model_dump())
        self.db.add(ban)
        self.db.flush()
        return ban

    def find_by_id(self, ban_id: int, bloquear: bool = False) -> Ban | None:
        return self.db.get(Ban, ban_id, with_for_update=bloquear)

    def list_all(self, comunidad_id: int | None, usuario_id: int | None) -> list[Ban]:
        consulta = select(Ban).order_by(Ban.id)
        if comunidad_id is not None:
            consulta = consulta.where(Ban.comunidad_id == comunidad_id)
        if usuario_id is not None:
            consulta = consulta.where(Ban.usuario_id == usuario_id)
        return list(self.db.scalars(consulta))

    def update(self, ban: Ban, dto: UpdateBanDTO) -> Ban:
        ban.motivo = dto.motivo
        ban.fecha_hasta = dto.fecha_hasta
        return ban

    def delete(self, ban: Ban) -> None:
        self.db.delete(ban)
