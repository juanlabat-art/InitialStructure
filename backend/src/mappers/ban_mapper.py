from src.db.models.ban_model import Ban
from src.dtos.ban_dto import BanResponseDTO


def to_ban_response(ban: Ban) -> BanResponseDTO:
    return BanResponseDTO.model_validate(ban)
