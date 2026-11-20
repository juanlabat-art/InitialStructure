from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from src.db.connection import Base
from src.db.models.comunidad_model import Comunidad
from src.db.models.usuario_model import Usuario


class MiembroComunidad(Base):
    __tablename__ = "miembros_comunidad"

    usuario_id = Column(Integer, ForeignKey(Usuario.id), primary_key=True)
    comunidad_id = Column(Integer, ForeignKey(Comunidad.id), primary_key=True)
    rol = Column(String(10), nullable=False, server_default="miembro")
    fecha_union = Column(DateTime, nullable=False, server_default=func.now())
