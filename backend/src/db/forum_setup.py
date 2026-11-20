from sqlalchemy import exists, inspect, select, text

from src.db.connection import Base, engine
from src.db.models.comunidad_model import Comunidad
from src.db.models.foro_model import memberships


def setup_forum_database() -> None:
    Base.metadata.create_all(engine)
    with engine.begin() as db:
        columns = {column["name"] for column in inspect(db).get_columns("post")}
        for name in ("es_pregunta", "opinar_primero"):
            if name not in columns:
                db.execute(text(f"ALTER TABLE post ADD COLUMN {name} BOOLEAN NOT NULL DEFAULT FALSE"))

        missing_creators = select(
            Comunidad.creador_id, Comunidad.id, text("'moderador'"), Comunidad.fecha_creacion,
        ).where(~exists(select(1).where(
            memberships.c.comunidad_id == Comunidad.id,
            memberships.c.usuario_id == Comunidad.creador_id,
        )))
        db.execute(memberships.insert().from_select(
            ["usuario_id", "comunidad_id", "rol", "fecha_union"], missing_creators,
        ))
