from src.db.models.comentario_model import Comentario
from src.dtos.comentario_dto import ComentarioResponseDTO


def to_comentario_response(
    comentario: Comentario,
) -> ComentarioResponseDTO:
    response = ComentarioResponseDTO.model_validate(comentario)
    return response.model_copy(update={"texto": ""}) if comentario.eliminado else response
