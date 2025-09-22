from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str 
    JWT_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",               # handy in dev
        "https://quiz-app-ui-ngo8.onrender.com"
    ]
    ALLOW_ADMIN_SELF_REGISTER: bool = True
    ADMIN_BOOTSTRAP_SECRET: str = "change-me"

    class Config:
        env_file = ".env"

settings = Settings()
