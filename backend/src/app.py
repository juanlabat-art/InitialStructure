from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.db.forum_setup import setup_forum_database
from src.db.local_setup import setup_local_database

from src.middlewares.error_middleware import app_error_handler
from src.routers import auth_router, user_router, pasajero_router, conductores_router
from src.utils.errors import AppError
from src.routers import usuario_router
from src.routers import comunidad_router
from src.routers import foro_router, post_router
from src.routers import comentario_router
from src.routers import voto_post_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_forum_database()
    setup_local_database()
    yield


app = FastAPI(title="Punto API", lifespan=lifespan)

app.add_exception_handler(AppError, app_error_handler)

app.include_router(user_router.router, prefix="/api")
app.include_router(auth_router.router, prefix="/api")
app.include_router(pasajero_router.router, prefix="/api")
app.include_router(conductores_router.router, prefix="/api")
app.include_router(usuario_router.router, prefix="/api")
app.include_router(comunidad_router.router, prefix="/api")
app.include_router(post_router.router, prefix="/api")
app.include_router(foro_router.router, prefix="/api")
app.include_router(comentario_router.router, prefix="/api")
app.include_router(voto_post_router.router, prefix="/api")
# TODO: registrar product_router cuando se implemente
# app.include_router(product_router.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
