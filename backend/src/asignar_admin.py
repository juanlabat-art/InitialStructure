"""Asigna el administrador general desde la consola del servidor."""

from argparse import ArgumentParser

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from src.db.connection import SessionLocal
from src.db.models.usuario_model import Usuario
from src.services.karma_service import KARMA_ADMIN


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("username")
    args = parser.parse_args()
    try:
        with SessionLocal.begin() as db:
            usuario = db.scalar(select(Usuario).where(
                Usuario.username == args.username.strip().lower(),
            ).with_for_update())
            if usuario is None or not usuario.clave_hash:
                parser.error("Elegí una cuenta registrada con contraseña activa")
            admin = db.scalar(select(Usuario.id).where(Usuario.rol_sitio == "admin"))
            if admin is not None and admin != usuario.id:
                parser.error("El sitio ya tiene un administrador general")
            usuario.rol_sitio = "admin"
            usuario.karma = KARMA_ADMIN
    except IntegrityError:
        parser.error("El sitio ya tiene un administrador general")
    print("Administrador general asignado.")


if __name__ == "__main__":
    main()
