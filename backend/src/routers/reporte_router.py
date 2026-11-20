from fastapi import APIRouter, Depends, Path, Query, Response, status
from sqlalchemy.orm import Session

from src.db.connection import get_db
from src.dtos.reporte_dto import CreateReporteDTO, ReporteResponseDTO, UpdateReporteDTO
from src.middlewares.integridad_middleware import RutaConIntegridad
from src.schemas.reporte_schema import CreateReporteSchema, UpdateReporteSchema
from src.services.reporte_service import ReporteService


router = APIRouter(prefix="/reporte", tags=["reportes"], route_class=RutaConIntegridad)


@router.post("/", response_model=ReporteResponseDTO, status_code=status.HTTP_201_CREATED)
def create_reporte(payload: CreateReporteSchema, db: Session = Depends(get_db)):
    dto = CreateReporteDTO(**payload.model_dump())
    return ReporteService(db).create(dto)


@router.get("/", response_model=list[ReporteResponseDTO])
def list_reportes(
    post_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
):
    return ReporteService(db).list_all(post_id)


@router.get("/{reporte_id}", response_model=ReporteResponseDTO)
def get_reporte(reporte_id: int = Path(gt=0), db: Session = Depends(get_db)):
    return ReporteService(db).get_by_id(reporte_id)


@router.put("/{reporte_id}", response_model=ReporteResponseDTO)
def update_reporte(
    payload: UpdateReporteSchema,
    reporte_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    dto = UpdateReporteDTO(**payload.model_dump())
    return ReporteService(db).update(reporte_id, dto)


@router.delete("/{reporte_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reporte(reporte_id: int = Path(gt=0), db: Session = Depends(get_db)):
    ReporteService(db).delete(reporte_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
