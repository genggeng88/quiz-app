from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

import logging, os, sys
from app.core.config import settings
from app.routers import auth, categories, quiz, contact
from app.routers import user as user_router
from app.routers import quiz_manage as quiz_router
from app.routers import question as question_router

from app.core.logging import setup_logging, get_logger
from app.middleware.request_id import RequestIDMiddleware
from app.core.errors import handle_http, handle_validation, handle_unexpected

setup_logging()
app = FastAPI(title="Quiz API")
log = get_logger("app")

allow_origins = [o.rstrip("/") for o in settings.CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID middleware
app.add_middleware(RequestIDMiddleware)

# Global exception handlers
app.add_exception_handler(StarletteHTTPException, handle_http)
app.add_exception_handler(RequestValidationError, handle_validation)
app.add_exception_handler(Exception, handle_unexpected)

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
