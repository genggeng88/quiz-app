from fastapi import APIRouter, Depends, Response, Request, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db import models
from app.db.schemas import RegisterIn, LoginIn, UserOut
from app.core.security import hash_password, verify_password, make_token, get_user_from_cookie
from app.core.config import settings
from sqlalchemy import select, func

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.post("/register", response_model=dict)
def register(body: RegisterIn, res: Response, db: Session = Depends(get_db)):
    exists = db.query(models.User).filter(models.User.email == body.email).first()
    if exists: raise HTTPException(400, "Email already registered")
    
    is_admin = getattr(body, "is_admin", False) if settings.ALLOW_ADMIN_SELF_REGISTER else False

    u = models.User(
        email=body.email,
        password_hash=hash_password(body.password),
        firstname=body.firstname,
        lastname=body.lastname,
        is_active=getattr(body, "is_active", True),
        is_admin=is_admin,
    )
    db.add(u); db.commit(); db.refresh(u)
    return {"ok": True, "message": "User registered successfully"}

@router.post("/login", response_model=dict)
def login(body: LoginIn, res: Response, db: Session = Depends(get_db)):
    u = db.query(models.User).filter(models.User.email == body.email).first()
    if not u or not verify_password(body.password, u.password_hash):
        raise HTTPException(400, "Invalid credentials")
    if not u.is_active:
        raise HTTPException(400, "User suspended")
    token = make_token({"user_id": u.user_id, "email": u.email, "is_admin": u.is_admin,
                        "full_name": f"{u.firstname} {u.lastname}"})
    res.set_cookie("token", token, httponly=True, samesite="lax")
    return {"ok": True, 
            "data": {
                "user": UserOut.model_validate(u.__dict__),
                "token": token
            }
        } 

@router.post("/logout", response_model=dict)
def logout(res: Response):
    res.delete_cookie("token")
    return {"ok": True, "data": {"message": "logged out"}}

@router.get("/me", response_model=dict)
def me(req: Request, db: Session = Depends(get_db)):
    payload = get_user_from_cookie(req)
    if not payload: return {"ok": True, "data": {"user": None}}
    u = db.get(models.User, payload["user_id"])
    return {"ok": True, "data": {"user": UserOut.model_validate(u) if u else None}}
