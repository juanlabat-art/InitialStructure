from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from src.db.connection import Base
from src.db.models.post_orm_model import Post
from src.db.models.usuario_model import Usuario


class Reporte(Base):
    __tablename__ = "reporte"

    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey(Usuario.id), nullable=False)
    post_id = Column(Integer, ForeignKey(Post.id), nullable=False)
    motivo = Column(String(255), nullable=False)
    fecha = Column(DateTime, nullable=False, server_default=func.now())
