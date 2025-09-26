from fastapi import APIRouter, Depends, Request, Query, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import require_auth
from app.schemas.schemas import QuizSubmitIn  # your existing Pydantic schema
from app.services import quiz as quiz_svc

import logging

log = logging.getLogger(__name__)

router = APIRouter(prefix="/quiz", tags=["quiz"])

@router.get("", response_model=dict)
def get_quiz_questions(
    req: Request,
    categoryId: int = Query(..., description="category_id"),
    db: Session = Depends(get_db)
):
    require_auth(req)
    data = quiz_svc.generate_quiz(db, category_id=categoryId)
    if not data:
        return {"ok": False, "error": "No questions found for the specified category."}
    return {"ok": True, "data": data}

@router.post("", response_model=dict)
def submit_quiz(
    payload: QuizSubmitIn,
    req: Request,
    db: Session = Depends(get_db)
):
    user = require_auth(req)
    try:
        data = quiz_svc.submit_quiz(
            db,
            user_id=user["user_id"],
            category_id=payload.categoryId,
            answers=[{"questionId": a.questionId, "choiceId": a.choiceId} for a in payload.answers],
            time_start=payload.timeStart,
            time_end=payload.timeEnd,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True, "data": data}

@router.get("/result/{quiz_id}", response_model=dict)
def quiz_result(quiz_id: int, req: Request, db: Session = Depends(get_db)):
    require_auth(req)
    data = quiz_svc.get_quiz_result(db, quiz_id=quiz_id)
    if not data:
        return {"ok": False, "error": "Quiz not found"}
    return {"ok": True, "data": data}

@router.get("/result", response_model=dict)
def user_quiz_list(req: Request, db: Session = Depends(get_db)):
    # log.info(f"/result request: {Request}")
    user = require_auth(req)
    data = quiz_svc.list_user_quizzes(db, user_id=user["user_id"])
    return {"ok": True, "data": data}
