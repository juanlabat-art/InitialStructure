"""Asigna una contraseña a una cuenta anterior desde la consola del servidor."""

from argparse import ArgumentParser
from getpass import getpass

from sqlalchemy import delete, select

from src.db.connection import SessionLocal
from src.db.models.usuario_model import Usuario, sesiones
from src.services.sesion_service import hash_clave


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("username")
    args = parser.parse_args()
    with SessionLocal.begin() as db:
        usuario = db.scalar(select(Usuario).where(Usuario.username == args.username).with_for_update())
        if usuario is None:
            parser.error("No existe ese usuario")
        clave = getpass("Nueva contraseña: ")
        if not 8 <= len(clave) <= 128:
            parser.error("La contraseña debe tener entre 8 y 128 caracteres")
        if clave != getpass("Repetí la contraseña: "):
            parser.error("Las contraseñas no coinciden")
        usuario.clave_hash = hash_clave(clave)
        db.execute(delete(sesiones).where(sesiones.c.usuario_id == usuario.id))
    print("Contraseña guardada.")


if __name__ == "__main__":
    main()
