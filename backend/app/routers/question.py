# app/routers/question.py
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, Literal
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_auth
from app.schemas.schemas import QuestionCreateIn, QuestionUpdateIn, QuestionPutIn
from app.services import question as q_svc
from app.services.question import admin_put_question

router = APIRouter(prefix="/admin/questions", tags=["admin:questions"])

def require_admin(req: Request):
    user = require_auth(req)
    if not (user.get("role") == "admin" or user.get("is_admin") is True):
        raise HTTPException(status_code=403, detail="Admin only")
    return user

class StatusIn(BaseModel):
    isActive: bool

@router.get("", response_model=dict, dependencies=[Depends(require_admin)])
def list_questions(
    db: Session = Depends(get_db),
    categoryId: Optional[int] = Query(None),
    q: Optional[str] = Query(None, description="search in question text"),
    includeChoices: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    data = q_svc.admin_list_questions(
        db,
        category_id=categoryId,
        query_text=q,
        include_choices=includeChoices,
        limit=limit,
        offset=offset,
    )
    return {"ok": True, "data": data}

@router.get("/{question_id}", response_model=dict, dependencies=[Depends(require_admin)])
def get_question(question_id: int, db: Session = Depends(get_db)):
    data = q_svc.admin_get_question(db, question_id=question_id)
    return {"ok": True, "data": data}

@router.post("", response_model=dict, dependencies=[Depends(require_admin)])
def create_question(payload: QuestionCreateIn, db: Session = Depends(get_db)):
    data = q_svc.admin_create_question(db, payload)
    return {"ok": True, "data": data}

@router.patch("/{question_id}", response_model=dict, dependencies=[Depends(require_admin)])
def update_question(question_id: int, payload: QuestionUpdateIn, db: Session = Depends(get_db)):
    q_svc.admin_update_question(db, question_id, payload)
    return {"ok": True}

@router.patch("/{question_id}/status", response_model=dict, dependencies=[Depends(require_admin)])
def set_question_status(question_id: int, payload: StatusIn, db: Session = Depends(get_db)):
    row = q_svc.admin_set_question_status(db, question_id=question_id, is_active=payload.isActive)
    return {"ok": True, "data": row}

@router.put("/{question_id}", response_model=dict)
def put_question(
    question_id: int,
    payload: QuestionPutIn,
    req: Request,
    db: Session = Depends(get_db),
):
    require_admin(req)
    admin_put_question(db, question_id, payload)
    return {"ok": True}