import logging 
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.logging import request_id_ctx, get_logger

log = get_logger(__name__)

def _err(detail, status_code: int):
    return JSONResponse(
        status_code=status_code,
        content={"ok": False, "error": detail, "rid": request_id_ctx.get() or "-"},
    )

async def handle_http(request: Request, exc: StarletteHTTPException):
    log.info(f"HTTP %s %s -> %s (%s)", request.method, request.url.path, exc.status_code, exc.detail)
    return _err(exc.detail, exc.status_code)

async def handle_validation(request: Request, exc: RequestValidationError):
    log.info("Validation error on %s %s: %s", request.method, request.url.path, exc.errors())
    return _err(exc.errors(), 422)

async def handle_unexpected(request: Request, exc: Exception):
    log.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return _err("Internal server error", 500)