from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func

from src.db.connection import Base
from src.db.models.post_orm_model import Post
from src.db.models.usuario_model import Usuario


class PostGuardado(Base):
    __tablename__ = "posts_guardados"

    usuario_id = Column(Integer, ForeignKey(Usuario.id), primary_key=True)
    post_id = Column(Integer, ForeignKey(Post.id), primary_key=True)
    fecha = Column(DateTime, nullable=False, server_default=func.now())
