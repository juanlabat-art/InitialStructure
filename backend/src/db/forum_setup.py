from uuid import uuid4

from sqlalchemy import func, inspect, select, text
from sqlalchemy.dialects.postgresql import insert as postgres_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from src.db.connection import Base, SessionLocal, engine
from src.db.models.comunidad_model import Comunidad
from src.db.models.foro_model import CATEGORIAS_ANONIMAS_SQL, memberships
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario
from src.services.karma_service import reconciliar_karma


STARTER_COMMUNITIES = {
    "general": "Presentaciones, dudas y conversaciones sobre temas de interés general.",
    "tecnologia": "Novedades, herramientas y proyectos de tecnología.",
    "estudio": "Recursos, métodos de estudio y consultas sobre materias.",
    "entretenimiento": "Conversaciones y recomendaciones sobre cine, series, música y juegos.",
}

FECHAS_CON_DEFAULT_POSTGRES = {
    "usuario": "fecha_registro",
    "comunidad": "fecha_creacion",
    "post": "fecha",
    "comentario": "fecha",
    "miembros_comunidad": "fecha_union",
    "posts_guardados": "fecha",
    "reporte": "fecha",
    "reporte_comentario": "fecha",
    "votos_post": "fecha",
    "votos_comentario": "fecha",
    "pregunta_anonima": "fecha",
    "respuesta_anonima": "fecha",
    "notificacion_reportes_post": "fecha",
}


def migrar_fechas_postgres(db) -> None:
    db.execute(text("SELECT pg_advisory_xact_lock(hashtext('vozero_fechas_postgres'))"))
    inspector = inspect(db)
    for tabla, columna in FECHAS_CON_DEFAULT_POSTGRES.items():
        columnas = {campo["name"]: campo["type"] for campo in inspector.get_columns(tabla)}
        if columnas[columna].timezone:
            continue
        # Los avisos de reportes ya se escribían en UTC desde Python.
        zona_original = "'UTC'" if tabla == "notificacion_reportes_post" else "current_setting('TimeZone')"
        db.execute(text(
            f"ALTER TABLE {tabla} ALTER COLUMN {columna} TYPE TIMESTAMP WITH TIME ZONE "
            f"USING {columna} AT TIME ZONE {zona_original}"
        ))


def setup_forum_database() -> None:
    Base.metadata.create_all(engine)
    with engine.begin() as db:
        user_columns = {column["name"] for column in inspect(db).get_columns("usuario")}
        if "clave_hash" not in user_columns:
            db.execute(text("ALTER TABLE usuario ADD COLUMN clave_hash VARCHAR(161)"))
        if "clave_anonima" not in user_columns:
            db.execute(text("ALTER TABLE usuario ADD COLUMN clave_anonima VARCHAR(32)"))
        if "descripcion" not in user_columns:
            db.execute(text("ALTER TABLE usuario ADD COLUMN descripcion VARCHAR(300)"))
        if "karma_por_nombramientos" not in user_columns:
            db.execute(text(
                "ALTER TABLE usuario ADD COLUMN karma_por_nombramientos INTEGER NOT NULL DEFAULT 0 "
                "CHECK (karma_por_nombramientos >= 0)"
            ))
        if "rol_sitio" not in user_columns:
            db.execute(text(
                "ALTER TABLE usuario ADD COLUMN rol_sitio VARCHAR(12) NOT NULL DEFAULT 'usuario' "
                "CHECK (rol_sitio IN ('usuario', 'subadmin', 'admin'))"
            ))
        db.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_admin_sitio ON usuario (rol_sitio) "
            "WHERE rol_sitio = 'admin'"
        ))
        columns = {column["name"]: column["type"] for column in inspect(db).get_columns("post")}
        if db.dialect.name == "postgresql":
            migrar_fechas_postgres(db)
        if "fecha_edicion" not in columns:
            column_type = Post.__table__.c.fecha_edicion.type.compile(dialect=db.dialect)
            db.execute(text(f"ALTER TABLE post ADD COLUMN fecha_edicion {column_type}"))
        if "solicitud_id" not in columns:
            db.execute(text("ALTER TABLE post ADD COLUMN solicitud_id VARCHAR(36)"))
        db.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_post_autor_solicitud ON post (autor_id, solicitud_id)"
        ))
        for name in ("es_pregunta", "opinar_primero", "eliminado"):
            if name not in columns:
                db.execute(text(f"ALTER TABLE post ADD COLUMN {name} BOOLEAN NOT NULL DEFAULT FALSE"))
        question_columns = {column["name"] for column in inspect(db).get_columns("pregunta_anonima")}
        if "categoria" not in question_columns:
            db.execute(text(
                "ALTER TABLE pregunta_anonima ADD COLUMN categoria VARCHAR(16) NOT NULL DEFAULT 'general' "
                f"CHECK (categoria IN ({CATEGORIAS_ANONIMAS_SQL}))"
            ))
        if "es_adulta" not in question_columns:
            db.execute(text("ALTER TABLE pregunta_anonima ADD COLUMN es_adulta BOOLEAN NOT NULL DEFAULT FALSE"))
        for table in ("pregunta_anonima", "respuesta_anonima"):
            columns = {column["name"] for column in inspect(db).get_columns(table)}
            if "autor_hash" not in columns:
                db.execute(text(f"ALTER TABLE {table} ADD COLUMN autor_hash VARCHAR(64)"))

    with SessionLocal.begin() as db:
        reconciliar_karma(db)


def setup_starter_communities() -> None:
    insert = {"sqlite": sqlite_insert, "postgresql": postgres_insert}.get(engine.dialect.name)
    if insert is None:
        return

    with SessionLocal.begin() as db:
        names = func.lower(Comunidad.nombre)
        existing = set(db.scalars(select(names).where(names.in_(STARTER_COMMUNITIES))))
        missing = STARTER_COMMUNITIES.keys() - existing
        if not missing:
            return

        email = "comunidades@vozero.invalid"
        owner_id = db.scalar(select(Usuario.id).where(Usuario.email == email))
        if owner_id is None:
            username = "vozero.comunidades"
            if db.scalar(select(Usuario.id).where(Usuario.username == username)) is not None:
                username = f"{username}.{uuid4().hex[:10]}"
            db.execute(insert(Usuario).values(username=username, email=email)
                       .on_conflict_do_nothing(index_elements=[Usuario.email]))
            owner_id = db.scalar(select(Usuario.id).where(Usuario.email == email))

        community_ids = db.scalars(insert(Comunidad).values([
            {"nombre": name, "descripcion": description, "creador_id": owner_id}
            for name, description in STARTER_COMMUNITIES.items() if name in missing
        ]).on_conflict_do_nothing(index_elements=[Comunidad.nombre]).returning(Comunidad.id))
        memberships_to_insert = [
            {"usuario_id": owner_id, "comunidad_id": community_id, "rol": "moderador"}
            for community_id in community_ids
        ]
        if memberships_to_insert:
            db.execute(memberships.insert(), memberships_to_insert)
