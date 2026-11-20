from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.foro_dto import UsuarioForoDTO
from src.dtos.usuario_dto import UsuarioResponseDTO
from src.schemas.usuario_schema import CreateUsuarioSchema, CredencialesUsuarioSchema
from src.services.sesion_service import cerrar_sesion, iniciar_sesion, sesion_actual, token_sesion
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


@router.get("/", response_model=list[UsuarioForoDTO])
def list_usuarios(db: Session = Depends(get_db)):
    return UsuarioService(db).list_all()


@router.get("/{usuario_id}", response_model=UsuarioForoDTO)
def get_usuario(usuario_id: int, db: Session = Depends(get_db)):
    return UsuarioService(db).get_by_id(usuario_id)
