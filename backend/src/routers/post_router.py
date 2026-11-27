from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.db.models.foto_model import fotos_post
from src.db.models.post_model import Post
from src.services.foro_service import ForumService
from src.services.sesion_service import exigir_servidor_web, sesion_actual, usuario_actual, verificar_actor
from src.dtos.post_dto import CreatePostDTO, PostResponseDTO, UpdatePostDTO
from src.schemas.post_schema import CreatePostSchema, UpdatePostSchema
from src.schemas.eliminacion_schema import ConfirmarEliminacionSchema
from src.services.post_service import PostService


router = APIRouter(prefix="/post", tags=["posts"])


@router.post("/", response_model=PostResponseDTO, status_code=status.HTTP_201_CREATED)
def create_post(payload: CreatePostSchema, db: Session = Depends(get_db), actor=Depends(usuario_actual)):
    verificar_actor(actor, payload.autor_id)
    dto = CreatePostDTO(**payload.model_dump(mode="json", exclude={"imagen"}))
    return PostService(db).create(dto, payload.imagen)


@router.get("/", response_model=list[PostResponseDTO])
def list_posts(
    comunidad_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
):
    return PostService(db).list_all(comunidad_id)


@router.get("/{post_id}", response_model=PostResponseDTO)
def get_post(post_id: int, db: Session = Depends(get_db)):
    return PostService(db).get_by_id(post_id)


@router.get("/{post_id}/imagen", response_class=Response)
def descargar_imagen(
    post_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: int | None = Depends(sesion_actual),
):
    post = db.get(Post, post_id)
    if post is None or post.eliminado or (
        post.oculto and (actor is None or ForumService(db).role(post.comunidad_id, actor) != "moderador")
    ):
        raise HTTPException(404, "La imagen no está disponible")
    fila = db.execute(select(fotos_post.c.version, fotos_post.c.contenido).where(
        fotos_post.c.id == post_id,
    )).one_or_none()
    if fila is None:
        raise HTTPException(404, "La imagen no está disponible")
    etag = f'"{fila.version}"'
    headers = {"Cache-Control": "private, no-cache", "ETag": etag, "X-Content-Type-Options": "nosniff"}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)
    return Response(fila.contenido, media_type="image/webp", headers=headers)


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
