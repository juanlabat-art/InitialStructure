from src.db.models.miembro_comunidad_model import MiembroComunidad
from src.dtos.miembro_comunidad_dto import MiembroComunidadResponseDTO


def to_miembro_comunidad_response(miembro: MiembroComunidad) -> MiembroComunidadResponseDTO:
    return MiembroComunidadResponseDTO.model_validate(miembro)
