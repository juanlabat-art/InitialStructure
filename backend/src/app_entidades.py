from fastapi import FastAPI

import src.db.models.post_orm_model  # Carga Post antes de importar los routers existentes.
from src.middlewares.error_middleware import app_error_handler
from src.routers import (
    auth_router,
    ban_router,
    comentario_router,
    comunidad_router,
    conductores_router,
    miembro_comunidad_router,
    pasajero_router,
    post_guardado_router,
    post_router,
    reporte_router,
    user_router,
    usuario_router,
    voto_comentario_router,
    voto_post_router,
)
from src.utils.errors import AppError


app = FastAPI(title="Initial Structure API")
app.add_exception_handler(AppError, app_error_handler)

for router in (
    user_router.router,
    auth_router.router,
    pasajero_router.router,
    conductores_router.router,
    usuario_router.router,
    comunidad_router.router,
    post_router.router,
    comentario_router.router,
    voto_post_router.router,
    reporte_router.router,
    ban_router.router,
    miembro_comunidad_router.router,
    voto_comentario_router.router,
    post_guardado_router.router,
):
    app.include_router(router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
