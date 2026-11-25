from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.services.sesion_service import exigir_servidor_web, usuario_actual, verificar_actor
from src.dtos.post_dto import CreatePostDTO, PostResponseDTO, UpdatePostDTO
from src.schemas.post_schema import CreatePostSchema, UpdatePostSchema
from src.schemas.eliminacion_schema import ConfirmarEliminacionSchema
from src.services.post_service import PostService


router = APIRouter(prefix="/post", tags=["posts"])


@router.post("/", response_model=PostResponseDTO, status_code=status.HTTP_201_CREATED)
def create_post(payload: CreatePostSchema, db: Session = Depends(get_db), actor=Depends(usuario_actual)):
    verificar_actor(actor, payload.autor_id)
    dto = CreatePostDTO(**payload.model_dump(mode="json"))
    return PostService(db).create(dto)


@router.get("/", response_model=list[PostResponseDTO])
def list_posts(
    comunidad_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
):
    return PostService(db).list_all(comunidad_id)


@router.get("/{post_id}", response_model=PostResponseDTO)
def get_post(post_id: int, db: Session = Depends(get_db)):
    return PostService(db).get_by_id(post_id)


@router.put("/{post_id}", response_model=PostResponseDTO)
def update_post(
    post_id: int,
    payload: UpdatePostSchema,
    actor=Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    dto = UpdatePostDTO(**payload.model_dump())
    return PostService(db).update(post_id, dto, actor)


@router.delete(
    "/{post_id}", status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(exigir_servidor_web)], include_in_schema=False,
)
def delete_post(
    post_id: int,
    confirmaciones: ConfirmarEliminacionSchema,
    db: Session = Depends(get_db),
    actor=Depends(usuario_actual),
):
    PostService(db).delete(post_id, actor)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
