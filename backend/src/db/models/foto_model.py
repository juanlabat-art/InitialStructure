from sqlalchemy import Column, ForeignKey, Integer, LargeBinary, String, Table, select
from sqlalchemy.orm import column_property

from src.db.connection import Base


fotos_usuario = Table(
    "foto_usuario", Base.metadata,
    Column("id", Integer, ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True),
    Column("version", String(64), nullable=False),
    Column("contenido", LargeBinary, nullable=False),
)

fotos_comunidad = Table(
    "foto_comunidad", Base.metadata,
    Column("id", Integer, ForeignKey("comunidad.id", ondelete="CASCADE"), primary_key=True),
    Column("version", String(64), nullable=False),
    Column("contenido", LargeBinary, nullable=False),
)

banners_comunidad = Table(
    "banner_comunidad", Base.metadata,
    Column("id", Integer, ForeignKey("comunidad.id", ondelete="CASCADE"), primary_key=True),
    Column("version", String(64), nullable=False),
    Column("contenido", LargeBinary, nullable=False),
)


def version_foto(tabla, titular):
    return column_property(select(tabla.c.version).where(tabla.c.id == titular).scalar_subquery())
