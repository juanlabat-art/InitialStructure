from sqlalchemy import delete, update
from sqlalchemy.orm import Session

from src.db.models.comentario_model import Comentario
from src.db.models.foro_model import comment_votes
from src.dtos.comentario_dto import (
    CreateComentarioDTO,
    UpdateComentarioDTO,
)


class ComentarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, dto: CreateComentarioDTO) -> Comentario:
        comentario = Comentario(
            post_id=dto.post_id,
            autor_id=dto.autor_id,
            comentario_padre_id=dto.comentario_padre_id,
            texto=dto.texto,
        )
        self.db.add(comentario)
        self.db.commit()
        self.db.refresh(comentario)
        return comentario

    def find_by_id(self, comentario_id: int) -> Comentario | None:
        return self.db.get(Comentario, comentario_id)

    def list_by_post(self, post_id: int) -> list[Comentario]:
        return (
            self.db.query(Comentario)
            .filter(Comentario.post_id == post_id)
            .order_by(Comentario.fecha.asc(), Comentario.id.asc())
            .all()
        )

    def update(
        self,
        comentario: Comentario,
        dto: UpdateComentarioDTO,
    ) -> Comentario:
        comentario.texto = dto.texto
        self.db.commit()
        self.db.refresh(comentario)
        return comentario

    def delete(self, comentario: Comentario) -> None:
        self.db.execute(
            update(Comentario)
            .where(Comentario.comentario_padre_id == comentario.id)
            .values(comentario_padre_id=comentario.comentario_padre_id)
        )
        self.db.execute(delete(comment_votes).where(
            comment_votes.c.comentario_id == comentario.id,
        ))
        self.db.execute(delete(Comentario).where(Comentario.id == comentario.id))
