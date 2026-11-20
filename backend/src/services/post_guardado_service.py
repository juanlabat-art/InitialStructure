from sqlalchemy.orm import Session

from src.dtos.post_guardado_dto import GuardarPostDTO, PostGuardadoResponseDTO
from src.mappers.post_guardado_mapper import to_post_guardado_response
from src.repositories.post_guardado_repository import PostGuardadoRepository
from src.repositories.usuario_repository import UsuarioRepository
from src.utils.errors import NotFoundError


class PostGuardadoService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PostGuardadoRepository(db)
        self.usuarios = UsuarioRepository(db)

    def guardar(self, dto: GuardarPostDTO) -> PostGuardadoResponseDTO:
        with self.db.begin():
            self._validar_usuario(dto.usuario_id)
            post = self.repo.find_post(dto.post_id)
            if post is None or post.oculto:
                raise NotFoundError("El post no existe o está oculto")

            guardado = self.repo.find(dto.usuario_id, dto.post_id)
            if guardado is None:
                guardado = self.repo.create(dto)
            return to_post_guardado_response(guardado)

    def list_by_usuario(self, usuario_id: int) -> list[PostGuardadoResponseDTO]:
        self._validar_usuario(usuario_id)
        return [
            to_post_guardado_response(guardado)
            for guardado in self.repo.list_by_usuario(usuario_id)
        ]

    def quitar(self, usuario_id: int, post_id: int) -> None:
        with self.db.begin():
            self.repo.delete(usuario_id, post_id)

    def _validar_usuario(self, usuario_id: int) -> None:
        if self.usuarios.find_by_id(usuario_id) is None:
            raise NotFoundError("El usuario no existe")
