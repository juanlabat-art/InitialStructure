from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.post_dto import CreatePostDTO, PostResponseDTO, UpdatePostDTO
from src.schemas.post_schema import CreatePostSchema, UpdatePostSchema
from src.services.post_service import PostService


router = APIRouter(prefix="/post", tags=["posts"])


@router.post("/", response_model=PostResponseDTO, status_code=status.HTTP_201_CREATED)
def create_post(payload: CreatePostSchema, db: Session = Depends(get_db)):
    dto = CreatePostDTO(**payload.model_dump())
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
    db: Session = Depends(get_db),
):
    dto = UpdatePostDTO(**payload.model_dump())
    return PostService(db).update(post_id, dto)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    PostService(db).delete(post_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)