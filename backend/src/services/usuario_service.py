from sqlalchemy.orm import Session

from src.dtos.usuario_dto import CreateUsuarioDTO, UsuarioResponseDTO
from src.mappers.usuario_mapper import to_usuario_response
from src.repositories.usuario_repository import UsuarioRepository


class UsuarioService:
    def __init__(self, db: Session):
        self.repo = UsuarioRepository(db)

    def create(self, dto: CreateUsuarioDTO) -> UsuarioResponseDTO:
        """Ejemplo completo: hashea la password, crea el user y devuelve el DTO de respuesta."""
        user = self.repo.create(
            username=dto.username,
            email=dto.email,
        )
        return to_usuario_response(user)

    def get_by_id(self, usuario_id: int) -> UsuarioResponseDTO:
        # TODO: buscar el user. Si no existe, lanzar NotFoundError. Devolver UserResponseDTO.
        ...

    def list_all(self) -> list[UsuarioResponseDTO]:
        # TODO: devolver lista de UserResponseDTO
        ...

    def update(self, usuario_id: int, dto) -> UsuarioResponseDTO:
        # TODO: validar existencia, aplicar cambios desde dto, devolver el DTO actualizado.
        ...

    def delete(self, usuario_id: int) -> None:
        # TODO: borrar el user. Si no existe, NotFoundError.
        ...
