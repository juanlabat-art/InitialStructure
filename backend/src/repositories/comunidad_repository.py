from hashlib import sha256

from sqlalchemy.orm import Session

from src.db.models.comunidad_model import Comunidad
from src.db.models.foto_model import banners_comunidad
from src.db.models.foro_model import bans, memberships
from src.dtos.comunidad_dto import CreateComunidadDTO, UpdateComunidadDTO


class ComunidadRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, dto: CreateComunidadDTO, banner: bytes | None = None) -> Comunidad:
        comunidad = Comunidad(
            nombre=dto.nombre,
            descripcion=dto.descripcion,
            creador_id=dto.creador_id,
            es_nsfw=dto.es_nsfw,
        )
        self.db.add(comunidad)
        self.db.flush()
        self.db.execute(memberships.insert().values(
            usuario_id=dto.creador_id, comunidad_id=comunidad.id, rol="moderador",
        ))
        if banner is not None:
            self.db.execute(banners_comunidad.insert().values(
                id=comunidad.id, contenido=banner, version=sha256(banner).hexdigest(),
            ))
        self.db.commit()
        self.db.refresh(comunidad)
        return comunidad

    def find_by_id(self, comunidad_id: int) -> Comunidad | None:
        return self.db.get(Comunidad, comunidad_id)

    def list_all(self) -> list[Comunidad]:
        return self.db.query(Comunidad).order_by(Comunidad.id).all()

    def update(self, comunidad: Comunidad, dto: UpdateComunidadDTO) -> Comunidad:
        comunidad.descripcion = dto.descripcion
        self.db.commit()
        self.db.refresh(comunidad)
        return comunidad

    def delete(self, comunidad: Comunidad) -> None:
        self.db.execute(bans.delete().where(bans.c.comunidad_id == comunidad.id))
        self.db.execute(memberships.delete().where(memberships.c.comunidad_id == comunidad.id))
        self.db.delete(comunidad)
        self.db.flush()
