from fastapi import FastAPI

from src.middlewares.error_middleware import app_error_handler
from src.routers import auth_router, user_router, pasajero_router, conductores_router
from src.utils.errors import AppError
from src.routers import usuario_router
from src.routers import comunidad_router

app = FastAPI(title="Initial Structure API")

app.add_exception_handler(AppError, app_error_handler)

app.include_router(user_router.router, prefix="/api")
app.include_router(auth_router.router, prefix="/api")
app.include_router(pasajero_router.router, prefix="/api")
app.include_router(conductores_router.router, prefix="/api")
app.include_router(usuario_router.router, prefix="/api")
app.include_router(comunidad_router.router, prefix="/api")
# TODO: registrar product_router cuando se implemente
# app.include_router(product_router.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
