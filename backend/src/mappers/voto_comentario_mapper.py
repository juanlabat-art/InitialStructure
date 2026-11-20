from src.db.models.voto_comentario_model import VotoComentario
from src.dtos.voto_comentario_dto import VotoComentarioResponseDTO


def to_voto_comentario_response(voto: VotoComentario) -> VotoComentarioResponseDTO:
    return VotoComentarioResponseDTO.model_validate(voto)
