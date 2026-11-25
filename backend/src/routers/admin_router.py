from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.admin_dto import CambioRolSitio, PaginaAdminDTO, SeccionAdmin, SeccionModerable, VisibilidadPost
from src.schemas.eliminacion_schema import ConfirmarEliminacionSchema
from src.services.admin_service import AdminService
from src.services.sesion_service import exigir_servidor_web, usuario_actual


router = APIRouter(prefix="/admin", tags=["administración del sitio"])


@router.get("/entradas", response_model=PaginaAdminDTO)
def listar(
    seccion: SeccionAdmin = "posts",
    pagina: int = Query(default=1, ge=1, le=100_000),
    q: str = Query(default="", max_length=100),
    db: Session = Depends(get_db),
    actor: int = Depends(usuario_actual),
):
    return AdminService(db).listar(actor, seccion, pagina, q)


@router.put("/usuarios/{usuario_id}/rol", status_code=204)
def cambiar_rol(
    payload: CambioRolSitio,
    usuario_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    actor: int = Depends(usuario_actual),
):
    AdminService(db).cambiar_rol(actor, usuario_id, payload.rol)


@router.put("/posts/{post_id}/visibilidad", status_code=204)
def cambiar_visibilidad(
    payload: VisibilidadPost,
    post_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    actor: int = Depends(usuario_actual),
):
    AdminService(db).cambiar_visibilidad(actor, post_id, payload.oculto)


@router.delete(
    "/usuarios/{usuario_id}", status_code=204,
    dependencies=[Depends(exigir_servidor_web)], include_in_schema=False,
)
def eliminar_usuario(
    confirmaciones: ConfirmarEliminacionSchema,
    usuario_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    actor: int = Depends(usuario_actual),
):
    AdminService(db).eliminar_usuario(actor, usuario_id)


@router.delete(
    "/{seccion}/{item_id}", status_code=204,
    dependencies=[Depends(exigir_servidor_web)], include_in_schema=False,
)
def eliminar(
    seccion: SeccionModerable,
    confirmaciones: ConfirmarEliminacionSchema,
    item_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    actor: int = Depends(usuario_actual),
):
    AdminService(db).eliminar(actor, seccion, item_id)
