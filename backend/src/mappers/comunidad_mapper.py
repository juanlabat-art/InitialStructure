from src.db.models.comunidad_model import Comunidad
from src.dtos.comunidad_dto import ComunidadResponseDTO


def to_comunidad_response(comunidad: Comunidad) -> ComunidadResponseDTO:
    return ComunidadResponseDTO.model_validate(comunidad)