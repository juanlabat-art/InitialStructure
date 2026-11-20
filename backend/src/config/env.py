from pathlib import Path
from secrets import token_urlsafe

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[2] / ".env")

    DATABASE_URL: str = "sqlite:///./punto-local.db"
    PORT: int = 8000
    JWT_SECRET: str = Field(default_factory=token_urlsafe)


settings = Settings()
