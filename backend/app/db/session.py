# app/db/session.py
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Create engine (sync)
# engine = create_engine(
#     settings.DATABASE_URL,
#     pool_pre_ping=True,
#     future=True,
# )

raw = settings.DATABASE_URL  # from env
if raw.startswith("postgres://"):
    raw = raw.replace("postgres://", "postgresql+psycopg://", 1)
elif raw.startswith("postgresql://"):
    raw = raw.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    raw,
    pool_pre_ping=True,
    future=True,
)

# Session factory
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    class_=Session,   # explicit, optional
    future=True,
)

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a DB session and makes sure it's closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
