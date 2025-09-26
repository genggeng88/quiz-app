# app/services/auth.py
from fastapi import HTTPException, Response, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.crud import user as user_crud
from app.core.security import hash_password, verify_password, make_token, get_user_from_cookie
from app.core.config import settings
from app.core.security import get_payload_from_token 

def register_user(
    db: Session,
    *,
    email: str,
    password: str,
    firstname: str,
    lastname: str,
    is_active_client: Optional[bool] = True,
    is_admin_client: Optional[bool] = False,
    admin_secret: Optional[str] = None
):
    # Unique email check
    if user_crud.get_user_by_email(db, email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Decide admin flag
    is_admin = False
    if settings.ALLOW_ADMIN_SELF_REGISTER:
        is_admin = bool(is_admin_client) and (admin_secret == settings.ADMIN_BOOTSTRAP_SECRET)

    pwd_hash = hash_password(password)

    u = user_crud.create_user(
        db,
        email=email,
        password_hash=pwd_hash,
        firstname=firstname,
        lastname=lastname,
        is_active=bool(is_active_client),
        is_admin=is_admin,
    )
    db.commit()
    return u

def authenticate_user(db: Session, *, email: str, password: str):
    u = user_crud.get_user_by_email(db, email)
    if not u or not verify_password(password, u.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not u.is_active:
        raise HTTPException(status_code=400, detail="User suspended")
    return u

def issue_login_token(res: Optional[Response], *, user) -> str:
    """Always returns a JWT string. Optionally sets a cookie if USE_COOKIE_AUTH=True."""
    token = make_token({
        "user_id": user.user_id,
        "email": user.email,
        "is_admin": user.is_admin,
        "full_name": f"{user.firstname} {user.lastname}",
    })
    if settings.USE_COOKIE_AUTH and res is not None:
        res.set_cookie(
            settings.COOKIE_NAME,
            token,
            httponly=True,
            samesite=settings.COOKIE_SAMESITE,
            secure=settings.COOKIE_SECURE,
            max_age=settings.COOKIE_MAX_AGE,
            path="/",
        )
    return token

def clear_login_cookie(res: Response):
    if settings.USE_COOKIE_AUTH:
        res.delete_cookie(settings.COOKIE_NAME, path="/")

def get_current_user(req: Request, db: Session):
    """
    Header-first auth:
      - Prefer 'Authorization: Bearer <token>'
      - If USE_COOKIE_AUTH=True and no header, fall back to cookie
    """
    payload = None

    # 1) Authorization header
    auth = req.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
        payload = get_payload_from_token(token)

    # 2) Optional cookie fallback
    if payload is None and settings.USE_COOKIE_AUTH:
        payload = get_user_from_cookie(req)

    if not payload:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = user_crud.get_user_by_id(db, payload["user_id"])
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user
