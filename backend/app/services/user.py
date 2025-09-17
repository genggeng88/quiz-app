# app/services/user.py
from typing import List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.crud import user as user_crud

VALID_STATUSES = {"active", "suspended"}

def admin_list_users(db: Session) -> List[Dict[str, Any]]:
    return user_crud.list_users(db)

def admin_set_user_status(db: Session, user_id: int, status: str) -> Dict[str, Any]:
    status = (status or "").lower()
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="status must be 'active' or 'suspended'")

    # keep update inside a transaction
    with db.begin():
        row = user_crud.update_user_status(db, user_id, status)
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return row
