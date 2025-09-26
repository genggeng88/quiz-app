from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from backend.app.db.models import Category
from db.seesion import get_db

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("", response_model=dict)
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Category).order_by(Category.name).all()
    return {"ok": True, "data": rows}
