from sqlalchemy import select
from sqlalchemy.orm import Session

from src.db.models.reporte_model import Reporte
from src.dtos.reporte_dto import CreateReporteDTO, UpdateReporteDTO


class ReporteRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, dto: CreateReporteDTO) -> Reporte:
        reporte = Reporte(**dto.model_dump())
        self.db.add(reporte)
        self.db.flush()
        return reporte

    def find_by_id(self, reporte_id: int, bloquear: bool = False) -> Reporte | None:
        return self.db.get(Reporte, reporte_id, with_for_update=bloquear)

    def list_all(self, post_id: int | None) -> list[Reporte]:
        consulta = select(Reporte).order_by(Reporte.id)
        if post_id is not None:
            consulta = consulta.where(Reporte.post_id == post_id)
        return list(self.db.scalars(consulta))

    def update(self, reporte: Reporte, dto: UpdateReporteDTO) -> Reporte:
        reporte.motivo = dto.motivo
        return reporte

    def delete(self, reporte: Reporte) -> None:
        self.db.delete(reporte)
