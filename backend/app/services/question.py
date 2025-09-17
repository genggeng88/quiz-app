# app/services/question.py
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.crud import question as q_crud
from app.schemas.schemas import QuestionCreateIn, QuestionPutIn  # if you have them

def _ensure_single_correct(choices: List[Dict[str, Any]]):
    # choices like {"description": str, "isCorrect": bool}
    if not choices:
        raise HTTPException(status_code=400, detail="choices must not be empty")
    if sum(1 for c in choices if c.get("isCorrect")) != 1:
        raise HTTPException(status_code=400, detail="exactly one choice must be correct")

def admin_list_questions(
    db: Session,
    *,
    category_id: Optional[int],
    query_text: Optional[str],
    include_choices: bool,
    limit: int,
    offset: int,
) -> List[Dict[str, Any]]:
    data = q_crud.list_questions(
        db,
        category_id=category_id,
        query_text=query_text,
        limit=limit,
        offset=offset,
    )
    if include_choices and data:
        ids = [d["question_id"] for d in data]
        by_q = q_crud.get_choices_for_questions(db, ids)
        for d in data:
            d["choices"] = by_q.get(d["question_id"], [])
    return data

def admin_get_question(db: Session, *, question_id: int) -> Dict[str, Any]:
    head = q_crud.get_question_header(db, question_id)
    if not head:
        raise HTTPException(status_code=404, detail="Question not found")
    choices = q_crud.get_question_choices(db, question_id)
    head["choices"] = choices
    return head

def admin_create_question(db: Session, payload: QuestionCreateIn) -> Dict[str, Any]:
    # Convert pydantic choices to dicts
    choices = [{"description": c.description, "isCorrect": c.isCorrect} for c in payload.choices]
    _ensure_single_correct(choices)
    with db.begin():
        qid = q_crud.insert_question(db, category_id=payload.categoryId, description=payload.description)
        q_crud.insert_choices(db, question_id=qid, choices=choices)
    return {"question_id": qid}

def admin_put_question(db: Session, question_id: int, payload: QuestionPutIn) -> None:
    if not payload.choices:
        raise HTTPException(status_code=400, detail="choices must not be empty")

    num_correct = sum(1 for c in payload.choices if c.isCorrect)
    if num_correct != 1:
        raise HTTPException(status_code=400, detail="exactly one choice must be correct")

    with db.begin():
        # 1) Update question fields
        q_crud.update_question_fields(
            db,
            question_id=question_id,
            description=payload.description,
            category_id=payload.categoryId,
            is_active=payload.isActive,
        )

        # 2) Enforce single-correct:
        #    Clear all first, then apply flags from payload (exactly one true)
        q_crud.clear_all_correct(db, question_id=question_id)

        # 3) Upsert all provided choices (update existing by choiceId, insert new if missing)
        for ch in payload.choices:
            q_crud.upsert_choice(
                db,
                question_id=question_id,
                choice_id=ch.choiceId,
                description=ch.description,
                is_correct=ch.isCorrect,
            )

def admin_set_question_status(db: Session, *, question_id: int, is_active: bool) -> Dict[str, Any]:
    with db.begin():
        res = q_crud.set_question_status(db, question_id=question_id, is_active=is_active)
        if not res:
            raise HTTPException(status_code=404, detail="Question not found")
        return res
