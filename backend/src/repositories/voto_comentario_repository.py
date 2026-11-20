from sqlalchemy import case, func, select, update
from sqlalchemy.orm import Session

from src.db.models.post_orm_model import Post
from src.db.models.comentario_model import Comentario
from src.db.models.usuario_model import Usuario
from src.db.models.voto_comentario_model import VotoComentario


class VotoComentarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_comentario(self, comentario_id: int, bloquear: bool = False) -> Comentario | None:
        consulta = (
            select(Comentario)
            .join(Post, Post.id == Comentario.post_id)
            .where(
                Comentario.id == comentario_id,
                Comentario.eliminado.is_(False),
                Post.oculto.is_(False),
            )
        )
        if bloquear:
            consulta = consulta.with_for_update(of=Comentario)
        return self.db.scalar(consulta)

    def find_voto(self, usuario_id: int, comentario_id: int) -> VotoComentario | None:
        return self.db.get(VotoComentario, (usuario_id, comentario_id))

    def save(
        self,
        usuario_id: int,
        comentario_id: int,
        valor: int,
        voto: VotoComentario | None,
    ) -> VotoComentario:
        if voto is None:
            voto = VotoComentario(usuario_id=usuario_id, comentario_id=comentario_id, valor=valor)
            self.db.add(voto)
        elif voto.valor != valor:
            voto.valor = valor
            voto.fecha = func.now()
        self.db.flush()
        return voto

    def delete(self, voto: VotoComentario) -> None:
        self.db.delete(voto)

    def actualizar_karma(self, autor_id: int, diferencia: int) -> None:
        consulta = (
            update(Usuario)
            .where(Usuario.id == autor_id)
            .values(karma=Usuario.karma + diferencia)
        )
        self.db.execute(consulta)

    def get_puntaje(self, comentario_id: int):
        consulta = select(
            func.count(case((VotoComentario.valor == 1, 1))).label("positivos"),
            func.count(case((VotoComentario.valor == -1, 1))).label("negativos"),
            func.coalesce(func.sum(VotoComentario.valor), 0).label("puntaje"),
        ).where(VotoComentario.comentario_id == comentario_id)
        return self.db.execute(consulta).one()
