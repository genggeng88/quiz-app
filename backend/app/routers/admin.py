from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import SessionLocal
from app.core.security import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("/users", response_model=dict)
def users(req: Request, db: Session = Depends(get_db)):
    require_admin(req)
    rows = db.execute(text("""
      SELECT user_id, email, firstname, lastname, is_active, is_admin
      FROM "user" ORDER BY user_id DESC
    """)).mappings().all()
    return {"ok": True, "data": rows}

@router.patch("/users/{user_id}/status", response_model=dict)
def toggle_user_status(user_id: int, req: Request, db: Session = Depends(get_db)):
    require_admin(req)
    row = db.execute(text("""
      UPDATE "user" SET is_active = NOT is_active WHERE user_id = :id
      RETURNING user_id, is_active
    """), {"id": user_id}).mappings().first()
    db.commit()
    if not row: raise HTTPException(404, "User not found")
    return {"ok": True, "data": row}

@router.get("/questions", response_model=dict)
def questions(req: Request, db: Session = Depends(get_db)):
    require_admin(req)
    rows = db.execute(text("""
      SELECT q.question_id, c.name AS category, q.description, q.is_active, q.category_id
      FROM question q JOIN category c ON c.category_id = q.category_id
      ORDER BY q.question_id DESC
    """)).mappings().all()
    return {"ok": True, "data": rows}

@router.get("/questions/{qid}", response_model=dict)
def question_detail(qid: int, req: Request, db: Session = Depends(get_db)):
    require_admin(req)
    q = db.execute(text("""SELECT * FROM question WHERE question_id = :id"""), {"id": qid}).mappings().first()
    ch = db.execute(text("""SELECT * FROM choice WHERE question_id = :id ORDER BY choice_id"""), {"id": qid}).mappings().all()
    return {"ok": True, "data": {"question": q, "choices": ch}}

@router.post("/questions", response_model=dict)
def create_question(payload: dict, req: Request, db: Session = Depends(get_db)):
    require_admin(req)
    category_id = payload["category_id"]; description = payload["description"]
    is_active = payload.get("is_active", True); options = payload["options"]
    with db.begin():
        q = db.execute(text("""
          INSERT INTO question(category_id, description, is_active)
          VALUES (:cid, :d, :a) RETURNING question_id
        """), {"cid": category_id, "d": description, "a": is_active}).mappings().first()
        qid = q["question_id"]
        for o in options:
            db.execute(text("""
              INSERT INTO choice(question_id, description, is_correct)
              VALUES (:qid, :desc, :ok)
            """), {"qid": qid, "desc": o["description"], "ok": bool(o["is_correct"])})
    return {"ok": True, "data": {"question_id": qid}}

@router.put("/questions/{qid}", response_model=dict)
def update_question(qid: int, payload: dict, req: Request, db: Session = Depends(get_db)):
    require_admin(req)
    category_id = payload["category_id"]; description = payload["description"]
    is_active = payload.get("is_active", True); options = payload["options"]
    with db.begin():
        db.execute(text("""
          UPDATE question SET category_id=:cid, description=:d, is_active=:a
          WHERE question_id=:id
        """), {"cid": category_id, "d": description, "a": is_active, "id": qid})
        db.execute(text("""DELETE FROM choice WHERE question_id=:id"""), {"id": qid})
        for o in options:
            db.execute(text("""
              INSERT INTO choice(question_id, description, is_correct)
              VALUES (:qid, :desc, :ok)
            """), {"qid": qid, "desc": o["description"], "ok": bool(o["is_correct"])})
    return {"ok": True, "data": {"updated": True}}
