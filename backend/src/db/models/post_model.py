from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, false
from sqlalchemy.sql import func

from src.db.connection import Base


class Post(Base):
    __tablename__ = "post"

    id = Column(Integer, primary_key=True)
    comunidad_id = Column(Integer, ForeignKey("comunidad.id"), nullable=False)
    autor_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    titulo = Column(String(300), nullable=False)
    contenido = Column(Text)
    fecha = Column(DateTime, nullable=False, server_default=func.now())
    oculto = Column(Boolean, nullable=False, server_default=false())
    es_pregunta = Column(Boolean, nullable=False, server_default=false())
    opinar_primero = Column(Boolean, nullable=False, server_default=false())
