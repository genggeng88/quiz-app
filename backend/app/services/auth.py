# app/services/auth.py
from fastapi import HTTPException, Response, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.crud import user as user_crud
from app.core.security import hash_password, verify_password, make_token, get_user_from_cookie
from app.core.config import settings

def register_user(
    db: Session,
    *,
    email: str,
    password: str,
    firstname: str,
    lastname: str,
    is_active_client: Optional[bool] = True,
    is_admin_client: Optional[bool] = False,
):
    # Unique email check
    if user_crud.get_user_by_email(db, email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Decide admin flag
    is_admin = bool(is_admin_client) if settings.ALLOW_ADMIN_SELF_REGISTER else False
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

def issue_login_token(res: Response, *, user) -> str:
    token = make_token({
        "user_id": user.user_id,
        "email": user.email,
        "is_admin": user.is_admin,
        "full_name": f"{user.firstname} {user.lastname}",
    })
    # Cookie flags: tune for prod
    res.set_cookie(
        "token",
        token,
        httponly=True,
        samesite="lax",
        secure=getattr(settings, "COOKIE_SECURE", False),
        max_age=getattr(settings, "COOKIE_MAX_AGE", 60*60*24*7),  # 7d default
        path="/",
    )
    return token

def clear_login_cookie(res: Response):
    res.delete_cookie("token", path="/")

def get_current_user_from_cookie(req: Request, db: Session):
    payload = get_user_from_cookie(req)
    if not payload:
        return None
    return user_crud.get_user_by_id(db, payload["user_id"])
