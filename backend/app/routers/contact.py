# app/routers/contact.py
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.schemas.schemas import ContactIn
from app.core.security import require_admin
from app.services import contact as contact_svc

router = APIRouter(prefix="/contact", tags=["contact"])

@router.post("", response_model=dict)
def submit_contact(body: ContactIn, db: Session = Depends(get_db)):
    data = contact_svc.submit_contact(
        db,
        subject=body.subject,
        message=body.message,
        email=body.email,
    )
    return {"ok": True, "data": data}

@router.get("", response_model=dict, dependencies=[Depends(require_admin)])
def list_contacts(db: Session = Depends(get_db)):
    rows = contact_svc.admin_list_contacts(db)
    return {"ok": True, "data": rows}

@router.get("/{contact_id}", response_model=dict, dependencies=[Depends(require_admin)])
def contact_detail(contact_id: int, db: Session = Depends(get_db)):
    row = contact_svc.admin_get_contact(db, contact_id)
    # keep original behavior: return {"data": null} if not found (no 404)
    return {"ok": True, "data": row}
