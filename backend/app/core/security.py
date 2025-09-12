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

def make_token(payload: dict) -> str:
    exp = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS)
    data = {**payload, "exp": exp}
    return jwt.encode(data, settings.JWT_SECRET, algorithm=ALGO)

def get_user_from_cookie(request: Request):
    token = request.cookies.get("token")
    if not token:
        return None
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGO])
    except Exception:
        return None

def require_auth(request: Request):
    user = get_user_from_cookie(request)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return user

def require_admin(request: Request):
    user = require_auth(request)
    if not user.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return user
