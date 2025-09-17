# app/crud/contact.py
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

def create_contact(db: Session, *, subject: str, message: str, email: str) -> Dict[str, Any]:
    row = db.execute(text("""
        INSERT INTO contacts(subject, message, email)
        VALUES (:s, :m, :e)
        RETURNING contact_id, subject, message, email, time
    """), {"s": subject, "m": message, "e": email}).mappings().first()
    return dict(row)

def list_contacts(db: Session) -> List[Dict[str, Any]]:
    rows = db.execute(text("""
        SELECT contact_id, subject, message, email, time
        FROM contacts
        ORDER BY time DESC
    """)).mappings().all()
    return [dict(r) for r in rows]

def get_contact(db: Session, contact_id: int) -> Optional[Dict[str, Any]]:
    row = db.execute(text("""
        SELECT contact_id, subject, message, email, time
        FROM contacts
        WHERE contact_id = :id
    """), {"id": contact_id}).mappings().first()
    return dict(row) if row else None
