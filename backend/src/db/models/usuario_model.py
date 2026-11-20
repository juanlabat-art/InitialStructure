from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.sql import func

from src.db.connection import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True)
    username = Column(String(30), nullable=False, unique=True)
    email = Column(String(255), unique=True, nullable=False)
    karma = Column(Integer, nullable=False, server_default="0")
    clave_hash = Column(String(161), nullable=True)
    fecha_registro = Column(DateTime, nullable=False, server_default=func.now())


sesiones = Table(
    "sesiones_usuario", Base.metadata,
    Column("token_hash", String(64), primary_key=True),
    Column("usuario_id", Integer, ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False),
    Column("vence", DateTime, nullable=False),
)
