from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from src.db.models.usuario_model import Usuario


class UsuarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, username: str, email: str, clave_hash: str) -> Usuario:
        usuario = Usuario(username=username, email=email, clave_hash=clave_hash)
        self.db.add(usuario)
        self.db.flush()
        return usuario

    def find_by_id(self, usuario_id: int) -> Usuario | None:
        return self.db.get(Usuario, usuario_id)

    def find_by_username(self, username: str) -> Usuario | None:
        return self.db.scalar(select(Usuario).where(func.lower(Usuario.username) == username))

    def exists_by_username_or_email(self, username: str, email: str) -> bool:
        return self.db.scalar(select(Usuario.id).where(or_(
            func.lower(Usuario.username) == username, func.lower(Usuario.email) == email,
        )).limit(1)) is not None

    def list_all(self) -> list[Usuario]:
        return list(self.db.scalars(select(Usuario).order_by(Usuario.id)))
