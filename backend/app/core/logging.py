import logging, os, sys
from typing import Optional
from contextvars import ContextVar

request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)

class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        rid = request_id_ctx.get()
        record.request_id = rid or "-"
        return True
    
class SafeFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return super().format(record)
    
def setup_logging() -> None:
    if logging.getLogger().handlers:
        return 
    
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    fmt = os.getenv(
        "LOG_FMT",
        "%(asctime)s %(levelname)s [%(name)s] rid=%(request_id)s %(message)s"
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(SafeFormatter(fmt))

    root = logging.getLogger()
    root.setLevel(getattr(logging, level, logging.INFO))
    root.addHandler(handler)
    root.addFilter(RequestIdFilter())

    logging.getLogger("uvicorn.access").setLevel(os.getenv("UVICORN_ACCESS_LOG_LEVEL", "WARNING"))

def get_logger(name: str = "app") -> logging.Logger:
    return logging.getLogger(name)