from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str 
    JWT_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = ["http://localhost:5173", "https://quiz-app-ui-ngo8.onrender.com"]
    ALLOW_ADMIN_SELF_REGISTER: bool = True
    ADMIN_BOOTSTRAP_SECRET: str = "change-me"

    class Config:
        env_file = ".env"

settings = Settings()
