from sqlalchemy import select
from sqlalchemy.orm import Session

from src.db.models.miembro_comunidad_model import MiembroComunidad
from src.dtos.miembro_comunidad_dto import CreateMiembroComunidadDTO, UpdateMiembroComunidadDTO


class MiembroComunidadRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, dto: CreateMiembroComunidadDTO) -> MiembroComunidad:
        miembro = MiembroComunidad(**dto.model_dump())
        self.db.add(miembro)
        self.db.flush()
        return miembro

    def find(
        self,
        usuario_id: int,
        comunidad_id: int,
        bloquear: bool = False,
    ) -> MiembroComunidad | None:
        return self.db.get(
            MiembroComunidad, (usuario_id, comunidad_id), with_for_update=bloquear
        )

    def list_by_comunidad(self, comunidad_id: int) -> list[MiembroComunidad]:
        consulta = (
            select(MiembroComunidad)
            .where(MiembroComunidad.comunidad_id == comunidad_id)
            .order_by(MiembroComunidad.usuario_id)
        )
        return list(self.db.scalars(consulta))

    def update(
        self, miembro: MiembroComunidad, dto: UpdateMiembroComunidadDTO
    ) -> MiembroComunidad:
        miembro.rol = dto.rol
        return miembro

    def delete(self, miembro: MiembroComunidad) -> None:
        self.db.delete(miembro)
