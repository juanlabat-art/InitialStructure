from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, false
from sqlalchemy.sql import func

from src.db.connection import Base


class Comunidad(Base):
    __tablename__ = "comunidad"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(21), nullable=False, unique=True)
    descripcion = Column(Text, nullable=True)
    creador_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    es_nsfw = Column(Boolean, nullable=False, server_default=false())
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())