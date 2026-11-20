from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, SmallInteger, String, Table, Text, false, func

from src.db.connection import Base


def foreign(name, target, *, primary_key=False):
    return Column(name, Integer, ForeignKey(f"{target}.id"), nullable=False, primary_key=primary_key)


def timestamp(name):
    return Column(name, DateTime, nullable=False, server_default=func.now())


memberships = Table(
    "miembros_comunidad", Base.metadata,
    foreign("usuario_id", "usuario", primary_key=True),
    foreign("comunidad_id", "comunidad", primary_key=True),
    Column("rol", String(10), nullable=False, server_default="miembro"),
    timestamp("fecha_union"),
)
saved = Table(
    "posts_guardados", Base.metadata,
    foreign("usuario_id", "usuario", primary_key=True),
    foreign("post_id", "post", primary_key=True),
    timestamp("fecha"),
)
comment_votes = Table(
    "votos_comentario", Base.metadata,
    foreign("usuario_id", "usuario", primary_key=True),
    foreign("comentario_id", "comentario", primary_key=True),
    Column("valor", SmallInteger, nullable=False),
    timestamp("fecha"),
)
reports = Table(
    "reporte", Base.metadata, Column("id", Integer, primary_key=True),
    foreign("usuario_id", "usuario"), foreign("post_id", "post"),
    Column("motivo", String(255), nullable=False), timestamp("fecha"),
)
bans = Table(
    "ban", Base.metadata, Column("id", Integer, primary_key=True),
    foreign("comunidad_id", "comunidad"), foreign("usuario_id", "usuario"),
    foreign("moderador_id", "usuario"), Column("motivo", String(255)),
    Column("fecha_hasta", DateTime),
)
questions = Table(
    "pregunta_anonima", Base.metadata, Column("id", Integer, primary_key=True),
    Column("titulo", String(300), nullable=False), Column("contenido", Text, nullable=False),
    Column("opinar_primero", Boolean, nullable=False, server_default=false()), timestamp("fecha"),
)
answers = Table(
    "respuesta_anonima", Base.metadata, Column("id", Integer, primary_key=True),
    foreign("pregunta_id", "pregunta_anonima"), Column("texto", Text, nullable=False),
    timestamp("fecha"),
)
unlocks = Table(
    "acceso_pregunta_anonima", Base.metadata,
    foreign("pregunta_id", "pregunta_anonima", primary_key=True),
    Column("sesion_hash", String(64), primary_key=True),
)
