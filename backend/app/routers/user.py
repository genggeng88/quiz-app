# app/routers/user.py
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Literal
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_auth
from app.services import user as user_svc
from app.core.security import require_admin

router = APIRouter(prefix="/admin/users", tags=["admin:users"])

class StatusIn(BaseModel):
    status: Literal["active", "suspended"]

@router.get("", response_model=dict, dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)):
    data = user_svc.admin_list_users(db)
    return {"ok": True, "data": data}

@router.patch("/{user_id}/status", response_model=dict, dependencies=[Depends(require_admin)])
def set_user_status(user_id: int, payload: StatusIn, db: Session = Depends(get_db)):
    row = user_svc.admin_set_user_status(db, user_id=user_id, status=payload.status)
    return {"ok": True, "data": row}
