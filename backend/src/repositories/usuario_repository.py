from sqlalchemy.orm import Session

from src.db.models.usuario_model import Usuario


class UsuarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, username: str, email: str) -> Usuario:
        usuario = Usuario(username=username, email=email)
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def find_by_id(self, usuario_id: int) -> Usuario | None:
        return self.db.query(Usuario).filter(Usuario.id == usuario_id).first()

    def find_by_email(self, email: str) -> Usuario | None:
        return self.db.query(Usuario).filter(Usuario.email == email).first()

    def list_all(self) -> list[Usuario]:
        # TODO: devolver todos los usuarios
        ...

    def update(self, usuario_id: int, **fields) -> Usuario | None:
        # TODO: actualizar los campos pasados en **fields y devolver el User actualizado
        ...

    def delete(self, usuario_id: int) -> bool:
        # TODO: borrar el User con ese id; devolver True si lo borró, False si no existía
        ...
