from src.db.models.user_model import User
from src.dtos.user_dto import UserResponseDTO


def to_user_response(usuario: User) -> UserResponseDTO:
    """Convierte un modelo SQLAlchemy en un DTO de respuesta."""
    return UserResponseDTO.model_validate(usuario)