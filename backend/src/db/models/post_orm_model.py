from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, false
from sqlalchemy.sql import func

from src.db.connection import Base
from src.db.models import post_model
from src.db.models.comunidad_model import Comunidad
from src.db.models.usuario_model import Usuario


class Post(Base):
    __tablename__ = "post"

    id = Column(Integer, primary_key=True)
    comunidad_id = Column(Integer, ForeignKey(Comunidad.id), nullable=False)
    autor_id = Column(Integer, ForeignKey(Usuario.id), nullable=False)
    titulo = Column(String(300), nullable=False)
    contenido = Column(Text, nullable=True)
    fecha = Column(DateTime, nullable=False, server_default=func.now())
    oculto = Column(Boolean, nullable=False, server_default=false())


# Los routers existentes importan Post desde un módulo que hoy contiene schemas.
post_model.Post = Post
