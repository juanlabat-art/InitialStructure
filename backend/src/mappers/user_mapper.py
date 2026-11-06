from src.db.models.user_model import User
from src.dtos.user_dto import UserResponseDTO


def to_usuario_response(usuario: usuario) -> UsuarioResponseDTO:
    """Convierte un Model SQLAlchemy en un DTO de respuesta (sin campos sensibles)."""
    return UserResponseDTO.model_validate(usuario)
