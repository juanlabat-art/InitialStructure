from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from src.db.models.post_guardado_model import PostGuardado
from src.db.models.post_orm_model import Post
from src.dtos.post_guardado_dto import GuardarPostDTO


class PostGuardadoRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_post(self, post_id: int) -> Post | None:
        return self.db.get(Post, post_id, with_for_update=True)

    def find(self, usuario_id: int, post_id: int) -> PostGuardado | None:
        return self.db.get(PostGuardado, (usuario_id, post_id))

    def create(self, dto: GuardarPostDTO) -> PostGuardado:
        guardado = PostGuardado(**dto.model_dump())
        self.db.add(guardado)
        self.db.flush()
        return guardado

    def list_by_usuario(self, usuario_id: int) -> list[PostGuardado]:
        consulta = (
            select(PostGuardado)
            .join(Post, Post.id == PostGuardado.post_id)
            .where(PostGuardado.usuario_id == usuario_id, Post.oculto.is_(False))
            .order_by(PostGuardado.fecha.desc(), PostGuardado.post_id.desc())
        )
        return list(self.db.scalars(consulta))

    def delete(self, usuario_id: int, post_id: int) -> None:
        consulta = delete(PostGuardado).where(
            PostGuardado.usuario_id == usuario_id, PostGuardado.post_id == post_id
        )
        self.db.execute(consulta)
