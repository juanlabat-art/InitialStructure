from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.dtos.voto_post_dto import (
    PuntajePostResponseDTO,
    VotarPostDTO,
    VotoPostResponseDTO,
)
from src.mappers.voto_post_mapper import to_voto_post_response
from src.repositories.usuario_repository import UsuarioRepository
from src.repositories.voto_post_repository import VotoPostRepository


class VotoPostService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = VotoPostRepository(db)
        self.usuarios = UsuarioRepository(db)

    def votar(self, dto: VotarPostDTO) -> VotoPostResponseDTO:
        try:
            post = self._buscar_post(dto.post_id, bloquear=True)

            if self.usuarios.find_by_id(dto.usuario_id) is None:
                raise HTTPException(
                    status_code=404,
                    detail="El usuario no existe",
                )

            voto = self.repo.find_voto(
                dto.usuario_id,
                dto.post_id,
            )
            valor_anterior = voto.valor if voto is not None else 0
            diferencia = dto.valor - valor_anterior

            voto = self.repo.save(
                usuario_id=dto.usuario_id,
                post_id=dto.post_id,
                valor=dto.valor,
                voto=voto,
            )

            if diferencia != 0:
                self.repo.actualizar_karma(
                    post.autor_id,
                    diferencia,
                )

            respuesta = to_voto_post_response(voto)
            self.db.commit()
            return respuesta

        except IntegrityError as error:
            self.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="No se pudo guardar el voto por un conflicto de datos",
            ) from error

        except Exception:
            self.db.rollback()
            raise

    def quitar(self, post_id: int, usuario_id: int) -> None:
        try:
            post = self._buscar_post(post_id, bloquear=True)
            voto = self.repo.find_voto(usuario_id, post_id)

            if voto is not None:
                valor_anterior = voto.valor
                self.repo.delete(voto)
                self.repo.actualizar_karma(
                    post.autor_id,
                    -valor_anterior,
                )

            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

    def get_puntaje(
        self,
        post_id: int,
    ) -> PuntajePostResponseDTO:
        self._buscar_post(post_id)
        resultado = self.repo.get_puntaje(post_id)

        return PuntajePostResponseDTO(
            post_id=post_id,
            positivos=resultado.positivos,
            negativos=resultado.negativos,
            puntaje=resultado.puntaje,
        )

    def _buscar_post(self, post_id: int, bloquear: bool = False):
        post = self.repo.find_post(post_id, bloquear)

        if post is None or post.oculto:
            raise HTTPException(
                status_code=404,
                detail="El post no existe o está oculto",
            )

        return post