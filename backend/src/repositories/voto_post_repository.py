from sqlalchemy import case, func, select, update
from sqlalchemy.orm import Session

from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario
from src.db.models.voto_post_model import VotoPost


class VotoPostRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_post(
        self,
        post_id: int,
        bloquear: bool = False,
    ) -> Post | None:
        consulta = select(Post).where(Post.id == post_id)

        if bloquear:
            consulta = consulta.with_for_update()

        return self.db.execute(consulta).scalar_one_or_none()

    def find_voto(
        self,
        usuario_id: int,
        post_id: int,
    ) -> VotoPost | None:
        return self.db.get(VotoPost, (usuario_id, post_id))

    def save(
        self,
        usuario_id: int,
        post_id: int,
        valor: int,
        voto: VotoPost | None,
    ) -> VotoPost:
        if voto is None:
            voto = VotoPost(
                usuario_id=usuario_id,
                post_id=post_id,
                valor=valor,
            )
            self.db.add(voto)
        else:
            voto.valor = valor
            voto.fecha = func.now()

        self.db.flush()
        self.db.refresh(voto)
        return voto

    def delete(self, voto: VotoPost) -> None:
        self.db.delete(voto)
        self.db.flush()

    def actualizar_karma(
        self,
        autor_id: int,
        diferencia: int,
    ) -> None:
        consulta = (
            update(Usuario)
            .where(Usuario.id == autor_id)
            .values(karma=Usuario.karma + diferencia)
        )
        self.db.execute(consulta)

    def get_puntaje(self, post_id: int):
        consulta = select(
            func.count(
                case((VotoPost.valor == 1, 1))
            ).label("positivos"),
            func.count(
                case((VotoPost.valor == -1, 1))
            ).label("negativos"),
            func.coalesce(
                func.sum(VotoPost.valor), 0
            ).label("puntaje"),
        ).where(VotoPost.post_id == post_id)

        return self.db.execute(consulta).one()