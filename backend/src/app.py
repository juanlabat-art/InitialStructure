from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from src.db.forum_setup import setup_forum_database, setup_starter_communities
from src.db.local_setup import setup_local_database

from src.middlewares.error_middleware import app_error_handler
from src.utils.errors import AppError
from src.routers import admin_router, consulta_foro_router, usuario_router
from src.routers import comunidad_router
from src.routers import foro_router, foto_router, post_router
from src.routers import comentario_router
from src.routers import voto_post_router
from src.services.sesion_service import usuario_actual

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_forum_database()
    setup_local_database()
    setup_starter_communities()
    yield


app = FastAPI(title="VoZero API", lifespan=lifespan)

app.add_exception_handler(AppError, app_error_handler)

app.include_router(usuario_router.router, prefix="/api")
app.include_router(admin_router.router, prefix="/api")
for router in (
    consulta_foro_router.router, comunidad_router.router, post_router.router,
    foro_router.router, comentario_router.router, voto_post_router.router, foto_router.router,
):
    app.include_router(router, prefix="/api", dependencies=[Depends(usuario_actual)])


@app.get("/health")
def health():
    return {"status": "ok"}
