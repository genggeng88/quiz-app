from datetime import datetime, timedelta
from jose import jwt
from passlib.hash import bcrypt
from fastapi import HTTPException, status, Request
from app.core.config import settings

ALGO = "HS256"

def hash_password(pw: str) -> str:
    return bcrypt.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.verify(pw, hashed)

def make_token(payload: Dict[str, Any]) -> str:
    exp = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS)
    to_encode = {**payload, "exp": exp}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def get_payload_from_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


def require_auth(request: Request) -> dict:
    token = None

    auth = request.headers.get("authorization") or ""
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()

    if not token:
        token = request.cookies.get("token")

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGO])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    return payload

def require_admin(request: Request):
    user = require_auth(request)
    if not user.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return user
