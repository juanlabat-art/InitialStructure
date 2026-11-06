from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from src.db.connection import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True)
    username = Column(String(30), nullable=False, unique=True)
    email = Column(String(250), unique=True, nullable=False)
    karma = Column(Integer, nullable=False, server_default=0)
    fecha_registro = Column(DateTime, nullable=False, server_default=func.now())
