from src.db.models.voto_post_model import VotoPost
from src.dtos.voto_post_dto import VotoPostResponseDTO


def to_voto_post_response(voto: VotoPost) -> VotoPostResponseDTO:
    return VotoPostResponseDTO.model_validate(voto)