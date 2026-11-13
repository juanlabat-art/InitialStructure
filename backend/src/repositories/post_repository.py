from sqlalchemy.orm import Session

from src.db.models.post_model import Post
from src.dtos.post_dto import CreatePostDTO, UpdatePostDTO


class PostRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, dto: CreatePostDTO) -> Post:
        post = Post(
            comunidad_id=dto.comunidad_id,
            autor_id=dto.autor_id,
            titulo=dto.titulo,
            contenido=dto.contenido,
        )
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return post

    def find_by_id(self, post_id: int) -> Post | None:
        return self.db.get(Post, post_id)

    def list_all(self, comunidad_id: int | None = None) -> list[Post]:
        consulta = self.db.query(Post).filter(Post.oculto.is_(False))
        if comunidad_id is not None:
            consulta = consulta.filter(Post.comunidad_id == comunidad_id)
        return consulta.order_by(Post.fecha.desc(), Post.id.desc()).all()

    def update(self, post: Post, dto: UpdatePostDTO) -> Post:
        post.titulo = dto.titulo
        post.contenido = dto.contenido
        self.db.commit()
        self.db.refresh(post)
        return post

    def delete(self, post: Post) -> None:
        self.db.delete(post)
        self.db.commit()