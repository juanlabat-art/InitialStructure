from src.db.models.post_guardado_model import PostGuardado
from src.dtos.post_guardado_dto import PostGuardadoResponseDTO


def to_post_guardado_response(guardado: PostGuardado) -> PostGuardadoResponseDTO:
    return PostGuardadoResponseDTO.model_validate(guardado)
