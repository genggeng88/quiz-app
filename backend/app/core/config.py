from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",               # handy in dev
        "https://quiz-app-ui-ngo8.onrender.com"
    ]
    ALLOW_ADMIN_SELF_REGISTER: bool = False
    ADMIN_BOOTSTRAP_SECRET: str = "change-me"

    # Auth mode toggles
    USE_COOKIE_AUTH: bool = False  # ← FALSE = header-only
    COOKIE_NAME: str = "token"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"   # "lax" | "strict" | "none"
    COOKIE_MAX_AGE: int = 60 * 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"

settings = Settings()
