from sqlalchemy import select

from src.db.connection import Base, SessionLocal, engine
from src.db.models.comunidad_model import Comunidad
from src.db.models.foro_model import memberships
from src.db.models.post_model import Post
from src.db.models.usuario_model import Usuario


def setup_local_database() -> None:
    if str(engine.url) != "sqlite:///./punto-local.db":
        return

    Base.metadata.create_all(engine)
    with SessionLocal.begin() as db:
        if db.scalar(select(Usuario.id).limit(1)) is not None:
            return

        lucia = Usuario(username="lucia.m", email="lucia@example.com")
        tomi = Usuario(username="tomirios", email="tomi@example.com")
        db.add_all([lucia, tomi])
        db.flush()

        tecnologia = Comunidad(
            nombre="tecnologia",
            descripcion="Novedades y proyectos de tecnología.",
            creador_id=lucia.id,
        )
        estudiantes = Comunidad(
            nombre="vidauniversitaria",
            descripcion="Apuntes, parciales y consejos para la facu.",
            creador_id=tomi.id,
        )
        db.add_all([tecnologia, estudiantes])
        db.flush()

        db.execute(memberships.insert(), [
            {"usuario_id": lucia.id, "comunidad_id": tecnologia.id, "rol": "moderador"},
            {"usuario_id": tomi.id, "comunidad_id": estudiantes.id, "rol": "moderador"},
        ])

        db.add_all([
            Post(comunidad_id=estudiantes.id, autor_id=tomi.id,
                 titulo="El truco que me salvó en época de parciales",
                 contenido="Estudiar en bloques de 40 minutos me ayudó a organizarme."),
            Post(comunidad_id=tecnologia.id, autor_id=lucia.id,
                 titulo="¿Qué proyecto están armando?",
                 contenido="Compartan qué están construyendo y qué aprendieron."),
            Post(comunidad_id=estudiantes.id, autor_id=tomi.id,
                 titulo="¿Cómo se organizan cuando tienen varias entregas?",
                 contenido="¿Usan calendario, listas o algún otro método?"),
            Post(comunidad_id=tecnologia.id, autor_id=lucia.id,
                 titulo="5 herramientas gratuitas para empezar a programar",
                 contenido="¿Qué herramienta le recomendarían a alguien que recién arranca?"),
        ])
