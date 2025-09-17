# app/services/quiz.py
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.crud import quiz as quiz_crud

def generate_quiz(db: Session, *, category_id: int) -> List[Dict[str, Any]]:
    return quiz_crud.get_random_questions_with_options(db, category_id)

def submit_quiz(
    db: Session,
    *,
    user_id: int,
    category_id: int,
    answers: List[Dict[str, int]],
    time_start: Optional[datetime],
    time_end: Optional[datetime],
) -> Dict[str, Any]:
    # Resolve times, keep them UTC-aware
    t_start = time_start or datetime.now(timezone.utc)
    t_end = time_end or t_start
    if t_end < t_start:
        raise ValueError("timeEnd must be >= timeStart")

    with db.begin():
        quiz_id = quiz_crud.insert_quiz(db, user_id=user_id, category_id=category_id,
                                        t_start=t_start, t_end=t_end)
        quiz_crud.insert_user_answers(db, quiz_id, answers)
        score = quiz_crud.compute_score(db, quiz_id)
        quiz_crud.update_quiz_score(db, quiz_id, score)

    return {
        "quizId": quiz_id,
        "score": float(score),
        "timeStart": t_start.isoformat(),
        "timeEnd": t_end.isoformat(),
        "durationSec": int((t_end - t_start).total_seconds()),
    }

def get_quiz_result(db: Session, *, quiz_id: int) -> Dict[str, Any] | None:
    header = quiz_crud.get_quiz_header(db, quiz_id)
    if not header:
        return None
    items = quiz_crud.get_quiz_items_with_all_choices(db, quiz_id)
    return {
        "quiz": header,
        "items": items,
        "correctness_rate": header.get("correct_rate", 0),
    }

def list_user_quizzes(db: Session, *, user_id: int) -> List[Dict[str, Any]]:
    return quiz_crud.list_quizzes_for_user(db, user_id)
