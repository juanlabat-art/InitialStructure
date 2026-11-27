from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String, Table
from sqlalchemy.sql import func

from src.db.connection import Base
from src.db.models.foto_model import fotos_usuario, version_foto


class Usuario(Base):
    __tablename__ = "usuario"
    __table_args__ = (
        CheckConstraint("rol_sitio IN ('usuario', 'subadmin', 'admin')", name="ck_usuario_rol_sitio"),
        CheckConstraint("karma_por_nombramientos >= 0", name="ck_usuario_karma_por_nombramientos"),
    )

    id = Column(Integer, primary_key=True)
    foto_version = version_foto(fotos_usuario, id)
    username = Column(String(30), nullable=False, unique=True)
    email = Column(String(255), unique=True, nullable=False)
    karma = Column(Integer, nullable=False, server_default="0")
    karma_por_nombramientos = Column(Integer, nullable=False, server_default="0")
    clave_hash = Column(String(161), nullable=True)
    clave_anonima = Column(String(32), nullable=True)
    descripcion = Column(String(300), nullable=True)
    rol_sitio = Column(String(12), nullable=False, server_default="usuario")
    fecha_registro = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    ultima_conexion = Column(DateTime(timezone=True), nullable=True)

    @property
    def perfil_visible(self) -> bool:
        return self.clave_hash is not None


Index(
    "uq_usuario_admin_sitio",
    Usuario.rol_sitio,
    unique=True,
    sqlite_where=Usuario.rol_sitio == "admin",
    postgresql_where=Usuario.rol_sitio == "admin",
)


sesiones = Table(
    "sesiones_usuario", Base.metadata,
    Column("token_hash", String(64), primary_key=True),
    Column("usuario_id", Integer, ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False),
    Column("vence", DateTime, nullable=False),
)
