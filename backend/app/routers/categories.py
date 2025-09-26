from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, get_db
from app.db.models import Category

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("", response_model=dict)
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Category).order_by(Category.name).all()
    return {"ok": True, "data": rows}
