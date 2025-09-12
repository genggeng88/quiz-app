from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import SessionLocal
from app.db.schemas import QuestionOut

router = APIRouter(prefix="/questions", tags=["questions"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("/by-category", response_model=dict)
def by_category(categoryId: int = Query(...), db: Session = Depends(get_db)):
    # 5 random active questions for category
    qs = db.execute(text("""
        SELECT q.question_id, q.description
        FROM question q
        WHERE q.category_id = :cat AND q.is_active = TRUE
        ORDER BY random()
        LIMIT 5
    """), {"cat": categoryId}).mappings().all()

    if not qs:
        return {"ok": True, "data": []}

    ids = [q["question_id"] for q in qs]
    ch = db.execute(text("""
        SELECT choice_id, question_id, description
        FROM choice WHERE question_id = ANY(:ids)
        ORDER BY choice_id
    """), {"ids": ids}).mappings().all()

    grouped: list[QuestionOut] = []
    for q in qs:
        opts = [{"choice_id": c["choice_id"], "description": c["description"]}
                for c in ch if c["question_id"] == q["question_id"]]
        grouped.append({"question_id": q["question_id"], "description": q["description"], "options": opts})
    return {"ok": True, "data": grouped}
