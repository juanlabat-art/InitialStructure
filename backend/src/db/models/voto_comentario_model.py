from sqlalchemy import Column, DateTime, ForeignKey, Integer, SmallInteger
from sqlalchemy.sql import func

from src.db.connection import Base
import src.db.models.post_orm_model  # Registra Post antes de importar Comentario.
from src.db.models.comentario_model import Comentario
from src.db.models.usuario_model import Usuario


class VotoComentario(Base):
    __tablename__ = "votos_comentario"

    usuario_id = Column(Integer, ForeignKey(Usuario.id), primary_key=True)
    comentario_id = Column(Integer, ForeignKey(Comentario.id), primary_key=True)
    valor = Column(SmallInteger, nullable=False)
    fecha = Column(DateTime, nullable=False, server_default=func.now())
