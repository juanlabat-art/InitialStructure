from src.db.models.reporte_model import Reporte
from src.dtos.reporte_dto import ReporteResponseDTO


def to_reporte_response(reporte: Reporte) -> ReporteResponseDTO:
    return ReporteResponseDTO.model_validate(reporte)
