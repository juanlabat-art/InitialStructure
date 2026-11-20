from fastapi import APIRouter, Depends, Path, Query, Response, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.ban_dto import BanResponseDTO, CreateBanDTO, UpdateBanDTO
from src.middlewares.integridad_middleware import RutaConIntegridad
from src.schemas.ban_schema import CreateBanSchema, UpdateBanSchema
from src.services.ban_service import BanService


router = APIRouter(prefix="/ban", tags=["bans"], route_class=RutaConIntegridad)


@router.post("/", response_model=BanResponseDTO, status_code=status.HTTP_201_CREATED)
def create_ban(payload: CreateBanSchema, db: Session = Depends(get_db)):
    dto = CreateBanDTO(**payload.model_dump())
    return BanService(db).create(dto)


@router.get("/", response_model=list[BanResponseDTO])
def list_bans(
    comunidad_id: int | None = Query(default=None, gt=0),
    usuario_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
):
    return BanService(db).list_all(comunidad_id, usuario_id)


@router.get("/{ban_id}", response_model=BanResponseDTO)
def get_ban(ban_id: int = Path(gt=0), db: Session = Depends(get_db)):
    return BanService(db).get_by_id(ban_id)


@router.put("/{ban_id}", response_model=BanResponseDTO)
def update_ban(
    payload: UpdateBanSchema,
    ban_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    dto = UpdateBanDTO(**payload.model_dump())
    return BanService(db).update(ban_id, dto)


@router.delete("/{ban_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ban(ban_id: int = Path(gt=0), db: Session = Depends(get_db)):
    BanService(db).delete(ban_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
