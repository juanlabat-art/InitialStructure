from sqlalchemy import Column, DateTime, ForeignKey, Integer, SmallInteger
from sqlalchemy.sql import func

from src.db.connection import Base
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario


class VotoPost(Base):
    __tablename__ = "votos_post"

    usuario_id = Column(
        Integer,
        ForeignKey(Usuario.id),
        primary_key=True,
    )
    post_id = Column(
        Integer,
        ForeignKey(Post.id),
        primary_key=True,
    )
    valor = Column(SmallInteger, nullable=False)
    fecha = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
