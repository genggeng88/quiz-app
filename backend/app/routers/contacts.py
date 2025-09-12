from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import SessionLocal
from app.db.schemas import ContactIn
from app.core.security import require_admin

router = APIRouter(prefix="/contact", tags=["contact"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.post("/", response_model=dict)
def submit_contact(body: ContactIn, db: Session = Depends(get_db)):
    row = db.execute(text("""
      INSERT INTO contact(subject, message, email)
      VALUES (:s, :m, :e) RETURNING contact_id, subject, message, email, time
    """), {"s": body.subject, "m": body.message, "e": body.email}).mappings().first()
    db.commit()
    return {"ok": True, "data": row}

@router.get("/", response_model=dict)
def list_contacts(req: Request, db: Session = Depends(get_db)):
    require_admin(req)
    rows = db.execute(text("""SELECT * FROM contact ORDER BY time DESC""")).mappings().all()
    return {"ok": True, "data": rows}

@router.get("/{contact_id}", response_model=dict)
def contact_detail(contact_id: int, req: Request, db: Session = Depends(get_db)):
    require_admin(req)
    row = db.execute(text("""SELECT * FROM contact WHERE contact_id = :id"""), {"id": contact_id}).mappings().first()
    return {"ok": True, "data": row}
