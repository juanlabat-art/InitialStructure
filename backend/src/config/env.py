from pathlib import Path
from secrets import token_urlsafe

from pydantic import Field, SecretStr

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[2] / ".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./punto-local.db"
    PORT: int = 8000
    VOZERO_WEB_DELETE_SECRET: SecretStr | None = Field(default=None, min_length=32)
    VOZERO_JWT_SECRET: SecretStr = Field(
        default_factory=lambda: SecretStr(token_urlsafe(48)), min_length=32,
    )


settings = Settings()
