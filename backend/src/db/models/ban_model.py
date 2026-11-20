from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from src.db.connection import Base
from src.db.models.comunidad_model import Comunidad
from src.db.models.usuario_model import Usuario


class Ban(Base):
    __tablename__ = "ban"

    id = Column(Integer, primary_key=True)
    comunidad_id = Column(Integer, ForeignKey(Comunidad.id), nullable=False)
    usuario_id = Column(Integer, ForeignKey(Usuario.id), nullable=False)
    moderador_id = Column(Integer, ForeignKey(Usuario.id), nullable=False)
    motivo = Column(String(255), nullable=True)
    fecha_hasta = Column(DateTime, nullable=True)
