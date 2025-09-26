# app/routers/auth.py
from fastapi import APIRouter, Depends, Response, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import RegisterIn, LoginIn, UserOut
from app.services import auth as auth_svc

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=dict)
def register(body: RegisterIn, res: Response, db: Session = Depends(get_db)):
    auth_svc.register_user(
        db,
        email=body.email,
        password=body.password,
        firstname=body.firstname,
        lastname=body.lastname,
        is_active_client=body.is_active,
        is_admin_client=body.is_admin,
    )
    # Your requirement: backend returns only message; frontend redirects to login
    return {"ok": True, "message": "User registered successfully"}

@router.post("/login", response_model=dict)
def login(body: LoginIn, res: Response, db: Session = Depends(get_db)):
    u = auth_svc.authenticate_user(db, email=body.email, password=body.password)
    token = auth_svc.issue_login_token(res, user=u)
    return {
        "ok": True,
        "data": {
            "user": UserOut.model_validate(u).model_dump(),
            "token": token,  # optional to include in response body
        },
    }

@router.post("/logout", response_model=dict)
def logout(res: Response):
    auth_svc.clear_login_cookie(res)
    return {"ok": True, "data": {"message": "logged out"}}
