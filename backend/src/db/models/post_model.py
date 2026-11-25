from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text, false
from sqlalchemy.sql import func

from src.db.connection import Base


class Post(Base):
    __tablename__ = "post"
    __table_args__ = (Index("uq_post_autor_solicitud", "autor_id", "solicitud_id", unique=True),)

    id = Column(Integer, primary_key=True)
    comunidad_id = Column(Integer, ForeignKey("comunidad.id"), nullable=False)
    autor_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    solicitud_id = Column(String(36), nullable=True)
    titulo = Column(String(300), nullable=False)
    contenido = Column(Text)
    fecha = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    fecha_edicion = Column(DateTime(timezone=True), nullable=True)
    oculto = Column(Boolean, nullable=False, server_default=false())
    eliminado = Column(Boolean, nullable=False, server_default=false())
    es_pregunta = Column(Boolean, nullable=False, server_default=false())
    opinar_primero = Column(Boolean, nullable=False, server_default=false())
