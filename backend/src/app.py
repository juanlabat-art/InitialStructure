from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.db.forum_setup import setup_forum_database
from src.db.local_setup import setup_local_database

from src.middlewares.error_middleware import app_error_handler
from src.utils.errors import AppError
from src.routers import consulta_foro_router, usuario_router
from src.routers import comunidad_router
from src.routers import foro_router, post_router
from src.routers import comentario_router
from src.routers import voto_post_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_forum_database()
    setup_local_database()
    yield


app = FastAPI(title="VoZero API", lifespan=lifespan)

app.add_exception_handler(AppError, app_error_handler)

app.include_router(usuario_router.router, prefix="/api")
app.include_router(consulta_foro_router.router, prefix="/api")
app.include_router(comunidad_router.router, prefix="/api")
app.include_router(post_router.router, prefix="/api")
app.include_router(foro_router.router, prefix="/api")
app.include_router(comentario_router.router, prefix="/api")
app.include_router(voto_post_router.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
