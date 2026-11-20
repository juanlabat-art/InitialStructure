from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.db.models.usuario_model import Usuario
from src.repositories.usuario_repository import UsuarioRepository
from src.services.sesion_service import hash_clave, verificar_clave


class UsuarioService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UsuarioRepository(db)

    def create(self, username: str, email: str, clave: str) -> Usuario:
        username, email = username.lower(), email.lower()
        mensaje = "El nombre de usuario o email ya está en uso"
        if self.repo.exists_by_username_or_email(username, email):
            raise HTTPException(409, mensaje)
        try:
            return self.repo.create(username, email, hash_clave(clave))
        except IntegrityError as error:
            self.db.rollback()
            raise HTTPException(409, mensaje) from error

    def authenticate(self, username: str, clave: str) -> Usuario:
        usuario = self.repo.find_by_username(username.lower())
        if usuario is None or not verificar_clave(clave, usuario.clave_hash):
            raise HTTPException(401, "Nombre de usuario o contraseña incorrectos")
        return usuario

    def get_by_id(self, usuario_id: int) -> Usuario:
        usuario = self.repo.find_by_id(usuario_id)
        if usuario is None:
            raise HTTPException(404, "El usuario no existe")
        return usuario

    def list_all(self) -> list[Usuario]:
        return self.repo.list_all()
