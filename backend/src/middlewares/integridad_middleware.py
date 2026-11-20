from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.routing import APIRoute
from sqlalchemy.exc import IntegrityError

from src.utils.errors import ConflictError


class RutaConIntegridad(APIRoute):
    def get_route_handler(self) -> Callable[[Request], Awaitable[Response]]:
        manejador = super().get_route_handler()

        async def manejar(request: Request) -> Response:
            try:
                return await manejador(request)
            except IntegrityError as error:
                codigo = getattr(error.orig, "sqlstate", None) or getattr(error.orig, "pgcode", None)
                if codigo == "23505":
                    raise ConflictError("El registro ya existe") from error
                if codigo == "23503":
                    raise ConflictError("Una referencia ya no está disponible") from error
                raise

        return manejar
