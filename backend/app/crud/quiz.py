# app/crud/quiz.py
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Iterable, List, Dict, Any

# Random 5 questions in a category, with randomized options
def get_random_questions_with_options(db: Session, category_id: int, limit: int = 5) -> List[Dict[str, Any]]:
    rows = db.execute(text("""
        SELECT
          q.question_id,
          q.description AS question,
          json_agg(
            json_build_object('choiceId', c.choice_id, 'description', c.description)
            ORDER BY random()
          ) AS options
        FROM questions q
        JOIN choice c ON c.question_id = q.question_id
        WHERE q.category_id = :cid
        GROUP BY q.question_id, q.description
        ORDER BY random()
        LIMIT :lim
    """), {"cid": category_id, "lim": limit}).mappings().all()
    return [dict(r) for r in rows]

def insert_quiz(db: Session, *, user_id: int, category_id: int, t_start, t_end) -> int:
    row = db.execute(text("""
        INSERT INTO quizzes(user_id, category_id, name, time_start, time_end, correct_rate)
        VALUES (:uid, :cid, 'Quiz', :ts, :te, 0)
        RETURNING quiz_id
    """), {"uid": user_id, "cid": category_id, "ts": t_start, "te": t_end}).mappings().first()
    return int(row["quiz_id"])

def insert_user_answers(db: Session, quiz_id: int, answers: Iterable[dict]) -> None:
    # answers: [{questionId, choiceId}, ...]
    if not answers:
        return
    values = [{"quiz_id": quiz_id, "qid": a["questionId"], "cid": a["choiceId"]} for a in answers]
    db.execute(text("""
        INSERT INTO quizquestion(quiz_id, question_id, user_choice_id)
        VALUES (:quiz_id, :qid, :cid)
    """), values)

def compute_score(db: Session, quiz_id: int) -> float:
    score = db.execute(text("""
        SELECT COALESCE(AVG(CASE WHEN c.is_correct THEN 1.0 ELSE 0.0 END), 0) AS score
        FROM quizquestion qq
        LEFT JOIN choice c ON c.choice_id = qq.user_choice_id
        WHERE qq.quiz_id = :id
    """), {"id": quiz_id}).scalar_one()
    return float(score or 0.0)

def update_quiz_score(db: Session, quiz_id: int, score: float) -> None:
    db.execute(text("UPDATE quizzes SET correct_rate = :r WHERE quiz_id = :id"),
               {"r": score, "id": quiz_id})

def get_quiz_header(db: Session, quiz_id: int) -> dict | None:
    row = db.execute(text("""
        SELECT q.quiz_id, q.time_start, q.time_end, q.correct_rate, c.name AS category
        FROM quizzes q JOIN category c ON c.category_id = q.category_id
        WHERE q.quiz_id = :id
    """), {"id": quiz_id}).mappings().first()
    return dict(row) if row else None

def get_quiz_items_with_all_choices(db: Session, quiz_id: int) -> List[Dict[str, Any]]:
    rows = db.execute(text("""
        SELECT
          qq.question_id,
          q.description AS question,
          ch.choice_id,
          ch.description AS option_desc,
          ch.is_correct,
          qq.user_choice_id
        FROM quizquestion qq
        JOIN questions q ON q.question_id = qq.question_id
        JOIN choice ch ON ch.question_id = q.question_id
        WHERE qq.quiz_id = :id
        ORDER BY q.question_id, ch.choice_id
    """), {"id": quiz_id}).mappings().all()
    return [dict(r) for r in rows]

def list_quizzes_for_user(db: Session, user_id: int) -> List[Dict[str, Any]]:
    rows = db.execute(text("""
        SELECT quiz_id, user_id, category_id, name, time_start, time_end, correct_rate
        FROM quizzes
        WHERE user_id = :uid
        ORDER BY time_start DESC
    """), {"uid": user_id}).mappings().all()
    return [dict(r) for r in rows]
