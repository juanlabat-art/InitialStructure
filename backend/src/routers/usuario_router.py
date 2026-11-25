from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.foro_dto import UsuarioForoDTO
from src.dtos.usuario_dto import UsuarioResponseDTO
from src.schemas.usuario_schema import (
    CreateUsuarioSchema,
    CredencialesUsuarioSchema,
    EditarPerfilSchema,
    EliminarCuentaSchema,
)
from src.services.sesion_service import (
    COOKIE,
    cerrar_sesion,
    exigir_servidor_web,
    iniciar_sesion,
    sesion_actual,
    token_sesion,
    usuario_actual,
    verificar_actor,
)
from src.services.usuario_service import UsuarioService


router = APIRouter(prefix="/usuario", tags=["usuarios"])


@router.post("/", response_model=UsuarioResponseDTO, status_code=201)
def registrar(payload: CreateUsuarioSchema, request: Request, response: Response,
              db: Session = Depends(get_db)):
    usuario = UsuarioService(db).create(payload.username, payload.email, payload.clave)
    iniciar_sesion(db, usuario, request, response)
    return usuario


@router.post("/sesion", response_model=UsuarioResponseDTO)
def login(payload: CredencialesUsuarioSchema, request: Request, response: Response,
          db: Session = Depends(get_db)):
    usuario = UsuarioService(db).authenticate(payload.username, payload.clave)
    iniciar_sesion(db, usuario, request, response)
    return usuario


@router.get("/sesion")
def sesion(actor=Depends(sesion_actual)):
    return {"usuario_id": actor}


@router.delete("/sesion", status_code=204)
def logout(response: Response, token=Depends(token_sesion), db: Session = Depends(get_db)):
    cerrar_sesion(db, token, response)


@router.put("/perfil", response_model=UsuarioForoDTO)
def editar_perfil(payload: EditarPerfilSchema, actor=Depends(usuario_actual), db: Session = Depends(get_db)):
    return UsuarioService(db).editar_perfil(actor, payload.descripcion)


@router.delete(
    "/cuenta", status_code=204,
    dependencies=[Depends(exigir_servidor_web)], include_in_schema=False,
)
def eliminar_cuenta(
    payload: EliminarCuentaSchema,
    response: Response,
    actor: int = Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    verificar_actor(actor, payload.usuario_id)
    UsuarioService(db).eliminar_cuenta(actor)
    response.delete_cookie(COOKIE, httponly=True, samesite="lax")


@router.get("/", response_model=list[UsuarioForoDTO], dependencies=[Depends(usuario_actual)])
def list_usuarios(db: Session = Depends(get_db)):
    return UsuarioService(db).list_all()


@router.get("/{usuario_id}", response_model=UsuarioForoDTO, dependencies=[Depends(usuario_actual)])
def get_usuario(usuario_id: int, db: Session = Depends(get_db)):
    return UsuarioService(db).get_by_id(usuario_id)
