from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.models import Category

router = APIRouter(prefix="/categories", tags=["categories"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("", response_model=dict)
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Category).order_by(Category.name).all()
    return {"ok": True, "data": rows}
