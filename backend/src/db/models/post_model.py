from sqlalchemy import Column, Integer, String

from src.db.connection import Base


class Post(Base):
    __tablename__ = "post"

    id = Column(Integer, primary_key=True)
    comunidad_id = Column(Integer, nullable=False, foreign_key=comunidad(id))
    email = Column(String, unique=True, nullable=False)
    telefono = Column(String, nullable=False)

