from enum import StrEnum

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, SmallInteger, String, Table, Text, false, func

from src.db.connection import Base


class CategoriaAnonima(StrEnum):
    GENERAL = "general"
    PELICULAS = "peliculas"
    JUEGOS = "juegos"
    ESTUDIO = "estudio"
    TECNOLOGIA = "tecnologia"
    CONVIVENCIA = "convivencia"
    MAYORES18 = "mayores18"
    OTROS = "otros"


CATEGORIAS_ANONIMAS_SQL = ", ".join(
    f"'{categoria.value}'" for categoria in CategoriaAnonima if categoria != CategoriaAnonima.MAYORES18
)


def foreign(name, target, *, primary_key=False):
    return Column(name, Integer, ForeignKey(f"{target}.id"), nullable=False, primary_key=primary_key)


def timestamp(name):
    return Column(name, DateTime(timezone=True), nullable=False, server_default=func.now())


memberships = Table(
    "miembros_comunidad", Base.metadata,
    foreign("usuario_id", "usuario", primary_key=True),
    foreign("comunidad_id", "comunidad", primary_key=True),
    Column("rol", String(10), nullable=False, server_default="miembro"),
    timestamp("fecha_union"),
    Column("fijada", Boolean, nullable=False, server_default=false()),
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
notifications = Table(
    "notificacion_foro", Base.metadata,
    Column("usuario_id", Integer, ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True),
    Column("comentario_id", Integer, ForeignKey("comentario.id", ondelete="CASCADE"), primary_key=True, index=True),
    Column("es_respuesta", Boolean, nullable=False),
    Column("leida", Boolean, nullable=False, server_default=false()),
)
reports = Table(
    "reporte", Base.metadata, Column("id", Integer, primary_key=True),
    foreign("usuario_id", "usuario"), foreign("post_id", "post"),
    Column("motivo", String(255), nullable=False), timestamp("fecha"),
)
comment_reports = Table(
    "reporte_comentario", Base.metadata,
    Column("usuario_id", Integer, ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True),
    Column("comentario_id", Integer, ForeignKey("comentario.id", ondelete="CASCADE"), primary_key=True, index=True),
    Column("motivo", String(255), nullable=False), timestamp("fecha"),
)
post_report_alerts = Table(
    "notificacion_reportes_post", Base.metadata,
    Column("usuario_id", Integer, ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True),
    Column("post_id", Integer, ForeignKey("post.id", ondelete="CASCADE"), primary_key=True, index=True),
    Column("leida", Boolean, nullable=False, server_default=false()), timestamp("fecha"),
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
    Column("categoria", String(16), nullable=False, server_default=CategoriaAnonima.GENERAL.value),
    Column("es_adulta", Boolean, nullable=False, server_default=false()),
    Column("autor_hash", String(64)),
    CheckConstraint(f"categoria IN ({CATEGORIAS_ANONIMAS_SQL})", name="ck_pregunta_anonima_categoria"),
)
answers = Table(
    "respuesta_anonima", Base.metadata, Column("id", Integer, primary_key=True),
    foreign("pregunta_id", "pregunta_anonima"), Column("texto", Text, nullable=False),
    Column("autor_hash", String(64)),
    timestamp("fecha"),
)
unlocks = Table(
    "acceso_pregunta_anonima", Base.metadata,
    foreign("pregunta_id", "pregunta_anonima", primary_key=True),
    Column("sesion_hash", String(64), primary_key=True),
)
