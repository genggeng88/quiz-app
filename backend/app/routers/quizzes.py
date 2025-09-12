from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import SessionLocal
from app.core.security import require_auth
from app.db.schemas import QuizSubmitIn

router = APIRouter(prefix="/quiz", tags=["quiz"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("/", response_model=dict)
def get_quiz_questions(
    req: Request,
    categoryId: int = Query(...), 
    db: Session = Depends(get_db)
):
    require_auth(req)
    questions = db.execute(text("""
        SELECT q.question_id, q.description AS question,
               json_agg(json_build_object('choiceId', c.choice_id, 'description', c.description) ORDER BY c.choice_id) AS options
        FROM question q
        JOIN choice c ON c.question_id = q.question_id
        WHERE q.category_id = :id
        GROUP BY q.question_id, q.description
        ORDER BY random()
        LIMIT 5
    """), {"id": categoryId}).mappings().all()

    if not questions:
        return {"ok": False, "error": "No questions found for the specified category."}

    # Get choices for each question
    ids = [q["question_id"] for q in questions]
    choices = db.execute(text("""
        SELECT question_id, choice_id, description
        FROM choice
        WHERE question_id = ANY(:ids)
        ORDER BY random()
    """), {"ids": ids}).mappings().all()

    # Group choices by question
    choices_by_qid = {}
    for c in choices:
        choices_by_qid.setdefault(c["question_id"], []).append({
            "choiceId": c["choice_id"],
            "description": c["description"]
        })

    # Build response
    data = []
    for q in questions:
        data.append({
            "questionId": q["question_id"],
            "question": q["question"],
            "options": choices_by_qid.get(q["question_id"], [])
        })

    return {"ok": True, "data": data}


@router.post("/", response_model=dict)
def submit_quiz(
    payload: QuizSubmitIn, 
    req: Request, 
    db: Session = Depends(get_db)
):
    user = require_auth(req)
    with db.begin():
        # Insert quiz record first (with correct_rate=0)
        qz = db.execute(text("""
            INSERT INTO quiz(user_id, category_id, name, time_start, time_end, correct_rate)
            VALUES (:uid, :cid, 'Quiz', now(), now(), 0)
            RETURNING quiz_id
        """), {"uid": user["user_id"], "cid": payload.categoryId}).mappings().first()
        quiz_id = qz["quiz_id"]

        # Insert user answers
        if payload.answers:
            values = [{"quiz_id": quiz_id, "qid": a.questionId, "cid": a.choiceId} for a in payload.answers]
            db.execute(text("""
                INSERT INTO quizquestion(quiz_id, question_id, user_choice_id)
                VALUES (:quiz_id, :qid, :cid)
            """), values)

        # Calculate score after inserting quiz questions
        score = db.execute(text("""
            SELECT COALESCE(AVG(CASE WHEN c.is_correct THEN 1.0 ELSE 0.0 END),0) AS score
            FROM quizquestion qq LEFT JOIN choice c ON c.choice_id = qq.user_choice_id
            WHERE qq.quiz_id = :id
        """), {"id": quiz_id}).scalar_one()

        # Update quiz record with correct_rate
        db.execute(text("""
            UPDATE quiz SET correct_rate = :rate WHERE quiz_id = :id
        """), {"rate": float(score), "id": quiz_id})

    return {"ok": True, "data": {"quizId": quiz_id, "score": float(score)}}

@router.get("/result/{quiz_id}", response_model=dict)
def quiz_result(
    quiz_id: int, 
    req: Request, 
    db: Session = Depends(get_db)
):
    require_auth(req)
    quiz = db.execute(text("""
      SELECT q.quiz_id, q.time_start, q.time_end, q.correct_rate, c.name AS category
      FROM quiz q JOIN category c ON c.category_id = q.category_id
      WHERE q.quiz_id = :id
    """), {"id": quiz_id}).mappings().first()
    if not quiz:
        return {"ok": False, "error": "Quiz not found"}

    items = db.execute(text("""
      SELECT qq.question_id, q.description AS question, ch.choice_id, ch.description AS option_desc,
            ch.is_correct, qq.user_choice_id
      FROM quizquestion qq
      JOIN question q ON q.question_id = qq.question_id
      JOIN choice ch ON ch.question_id = q.question_id
      WHERE qq.quiz_id = :id
      ORDER BY q.question_id, ch.choice_id
    """), {"id": quiz_id}).mappings().all()

    # Serialize items to dicts
    items = [dict(i) for i in items]

    return {
        "ok": True,
        "data": {
            "quiz": dict(quiz),
            "items": items,
            "correctness_rate": quiz["correct_rate"]
        }
    } 

@router.get("/result", response_model=dict)
def user_quiz_list(req: Request, db: Session = Depends(get_db)):
    user = require_auth(req)
    quizzes = db.execute(text("""
        SELECT quiz_id, user_id, category_id, name, time_start, time_end
        FROM quiz
        WHERE user_id = :uid
        ORDER BY time_start DESC
    """), {"uid": user["user_id"]}).mappings().all()
    quizzes = [dict(q) for q in quizzes]
    return {"ok": True, "data": quizzes}