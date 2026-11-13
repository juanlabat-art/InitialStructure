from sqlalchemy.orm import Session

from src.db.models.comunidad_model import Comunidad
from src.dtos.comunidad_dto import CreateComunidadDTO, UpdateComunidadDTO


class ComunidadRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, dto: CreateComunidadDTO) -> Comunidad:
        comunidad = Comunidad(
            nombre=dto.nombre,
            descripcion=dto.descripcion,
            creador_id=dto.creador_id,
            es_nsfw=dto.es_nsfw,
        )
        self.db.add(comunidad)
        self.db.commit()
        self.db.refresh(comunidad)
        return comunidad

    def find_by_id(self, comunidad_id: int) -> Comunidad | None:
        return self.db.get(Comunidad, comunidad_id)

    def list_all(self) -> list[Comunidad]:
        return self.db.query(Comunidad).order_by(Comunidad.id).all()

    def update(self, comunidad: Comunidad, dto: UpdateComunidadDTO) -> Comunidad:
        comunidad.nombre = dto.nombre
        comunidad.descripcion = dto.descripcion
        comunidad.es_nsfw = dto.es_nsfw
        self.db.commit()
        self.db.refresh(comunidad)
        return comunidad

    def delete(self, comunidad: Comunidad) -> None:
        self.db.delete(comunidad)
        self.db.commit()