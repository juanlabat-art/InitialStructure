from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    false,
)
from sqlalchemy.sql import func

from src.db.connection import Base
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario


class Comentario(Base):
    __tablename__ = "comentario"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey(Post.id), nullable=False)
    autor_id = Column(Integer, ForeignKey(Usuario.id), nullable=False)
    comentario_padre_id = Column(
        Integer,
        ForeignKey("comentario.id"),
        nullable=True,
    )
    texto = Column(Text, nullable=False)
    fecha = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
    eliminado = Column(
        Boolean,
        nullable=False,
        server_default=false(),
    )