# app/services/contact.py
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.crud import contact as contact_crud

def submit_contact(db: Session, *, subject: str, message: str, email: str) -> Dict[str, Any]:
    # (Business rules/validation could live here if needed)
    data = contact_crud.create_contact(db, subject=subject, message=message, email=email)
    db.commit()  # commit the insert
    return data

def admin_list_contacts(db: Session) -> List[Dict[str, Any]]:
    return contact_crud.list_contacts(db)

def admin_get_contact(db: Session, contact_id: int) -> Optional[Dict[str, Any]]:
    return contact_crud.get_contact(db, contact_id)
