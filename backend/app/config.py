from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://username:password@localhost:5432/webnotes"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def parse_database_url(cls, value):
        if isinstance(value, str):
            if value.startswith("postgres://"):
                value = value.replace("postgres://", "postgresql+asyncpg://", 1)
            elif value.startswith("postgresql://") and not value.startswith("postgresql+asyncpg://"):
                value = value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Email
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""

    # App
    APP_NAME: str = "Web Note App"
    DEBUG: bool = True

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str) and value.lower() in {"release", "prod", "production"}:
            return False
        return value

    class Config:
        env_file = ".env"


settings = Settings()
