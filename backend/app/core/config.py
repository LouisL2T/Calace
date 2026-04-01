from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Calace"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql+asyncpg://calace:calace@localhost:5432/calace"
    DATABASE_URL_SYNC: str = "postgresql://calace:calace@localhost:5432/calace"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    ALGORITHM: str = "HS256"

    # AI
    ANTHROPIC_API_KEY: str = ""
    AI_MODEL: str = "claude-sonnet-4-6"

    # Communication
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""

    # Vector DB
    VECTOR_DIMENSION: int = 1536

    class Config:
        env_file = ".env"


settings = Settings()
