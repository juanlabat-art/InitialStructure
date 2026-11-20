from sqlalchemy import inspect, text

from src.db.connection import Base, SessionLocal, engine
from src.services.karma_service import reconciliar_karma


def setup_forum_database() -> None:
    Base.metadata.create_all(engine)
    with engine.begin() as db:
        columns = {column["name"] for column in inspect(db).get_columns("post")}
        for name in ("es_pregunta", "opinar_primero"):
            if name not in columns:
                db.execute(text(f"ALTER TABLE post ADD COLUMN {name} BOOLEAN NOT NULL DEFAULT FALSE"))

    with SessionLocal.begin() as db:
        reconciliar_karma(db)
