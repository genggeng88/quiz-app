from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging, os, sys
from app.core.config import settings
from app.routers import auth, categories, quiz, contact
from app.routers import user as user_router
from app.routers import quiz_manage as quiz_router
from app.routers import question as question_router

def setup_logging() -> None:
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    root = logging.getLogger()
    # Always set the root level (even if Uvicorn already attached handlers)
    root.setLevel(level)

    # Ensure there is at least one stream handler to stdout
    if not any(isinstance(h, logging.StreamHandler) for h in root.handlers):
        h = logging.StreamHandler(sys.stdout)
        h.setFormatter(logging.Formatter(
            "%(asctime)s %(levelname)s [%(name)s] %(message)s"
        ))
        h.setLevel(level)
        root.addHandler(h)

    # Optional: tone down noisy libs
    logging.getLogger("uvicorn.access").setLevel(os.getenv("UVICORN_ACCESS_LOG_LEVEL", "WARNING"))

setup_logging()

app = FastAPI(title="Quiz API")
allow_origins = [o.rstrip("/") for o in settings.CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def health(): return {"ok": True}

log = logging.getLogger("app")   # your app-wide logger
log.info("FastAPI starting…")

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(quiz.router)
app.include_router(contact.router)
app.include_router(user_router.router)
app.include_router(quiz_router.router)
app.include_router(question_router.router)
