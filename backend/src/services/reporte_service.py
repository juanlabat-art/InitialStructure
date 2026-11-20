from sqlalchemy.orm import Session

from src.db.models.reporte_model import Reporte
from src.dtos.reporte_dto import CreateReporteDTO, ReporteResponseDTO, UpdateReporteDTO
from src.mappers.reporte_mapper import to_reporte_response
from src.repositories.post_repository import PostRepository
from src.repositories.reporte_repository import ReporteRepository
from src.repositories.usuario_repository import UsuarioRepository
from src.utils.errors import NotFoundError


class ReporteService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ReporteRepository(db)
        self.posts = PostRepository(db)
        self.usuarios = UsuarioRepository(db)

    def create(self, dto: CreateReporteDTO) -> ReporteResponseDTO:
        with self.db.begin():
            if self.usuarios.find_by_id(dto.usuario_id) is None:
                raise NotFoundError("El usuario no existe")
            post = self.posts.find_by_id(dto.post_id)
            if post is None or post.oculto:
                raise NotFoundError("El post no existe o está oculto")
            return to_reporte_response(self.repo.create(dto))

    def get_by_id(self, reporte_id: int) -> ReporteResponseDTO:
        return to_reporte_response(self._buscar(reporte_id))

    def list_all(self, post_id: int | None = None) -> list[ReporteResponseDTO]:
        return [to_reporte_response(reporte) for reporte in self.repo.list_all(post_id)]

    def update(self, reporte_id: int, dto: UpdateReporteDTO) -> ReporteResponseDTO:
        with self.db.begin():
            reporte = self._buscar(reporte_id, bloquear=True)
            return to_reporte_response(self.repo.update(reporte, dto))

    def delete(self, reporte_id: int) -> None:
        with self.db.begin():
            self.repo.delete(self._buscar(reporte_id, bloquear=True))

    def _buscar(self, reporte_id: int, bloquear: bool = False) -> Reporte:
        reporte = self.repo.find_by_id(reporte_id, bloquear)
        if reporte is None:
            raise NotFoundError("El reporte no existe")
        return reporte
