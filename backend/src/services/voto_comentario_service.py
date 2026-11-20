from sqlalchemy.orm import Session

from src.dtos.voto_comentario_dto import (
    PuntajeComentarioResponseDTO,
    VotarComentarioDTO,
    VotoComentarioResponseDTO,
)
from src.mappers.voto_comentario_mapper import to_voto_comentario_response
from src.db.models.comentario_model import Comentario
from src.repositories.usuario_repository import UsuarioRepository
from src.repositories.voto_comentario_repository import VotoComentarioRepository
from src.utils.errors import NotFoundError


class VotoComentarioService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = VotoComentarioRepository(db)
        self.usuarios = UsuarioRepository(db)

    def votar(self, dto: VotarComentarioDTO) -> VotoComentarioResponseDTO:
        with self.db.begin():
            comentario = self._buscar_comentario(dto.comentario_id, bloquear=True)
            if self.usuarios.find_by_id(dto.usuario_id) is None:
                raise NotFoundError("El usuario no existe")

            voto = self.repo.find_voto(dto.usuario_id, dto.comentario_id)
            valor_anterior = voto.valor if voto is not None else 0
            voto = self.repo.save(dto.usuario_id, dto.comentario_id, dto.valor, voto)
            diferencia = dto.valor - valor_anterior
            if diferencia != 0:
                self.repo.actualizar_karma(comentario.autor_id, diferencia)
            return to_voto_comentario_response(voto)

    def quitar(self, comentario_id: int, usuario_id: int) -> None:
        with self.db.begin():
            comentario = self._buscar_comentario(comentario_id, bloquear=True)
            voto = self.repo.find_voto(usuario_id, comentario_id)
            if voto is not None:
                self.repo.actualizar_karma(comentario.autor_id, -voto.valor)
                self.repo.delete(voto)

    def get_puntaje(self, comentario_id: int) -> PuntajeComentarioResponseDTO:
        self._buscar_comentario(comentario_id)
        resultado = self.repo.get_puntaje(comentario_id)
        return PuntajeComentarioResponseDTO(
            comentario_id=comentario_id,
            positivos=resultado.positivos,
            negativos=resultado.negativos,
            puntaje=resultado.puntaje,
        )

    def _buscar_comentario(self, comentario_id: int, bloquear: bool = False) -> Comentario:
        comentario = self.repo.find_comentario(comentario_id, bloquear)
        if comentario is None:
            raise NotFoundError("El comentario no está disponible")
        return comentario
