# app/crud/question.py
from typing import List, Dict, Any, Optional, Iterable
from sqlalchemy.orm import Session
from sqlalchemy import text

def list_questions(
    db: Session,
    *,
    category_id: Optional[int],
    query_text: Optional[str],
    limit: int,
    offset: int,
) -> List[Dict[str, Any]]:
    where = ["1=1"]
    params: Dict[str, Any] = {"limit": limit, "offset": offset}
    if category_id is not None:
        where.append("qs.category_id = :cid")
        params["cid"] = category_id
    if query_text:
        where.append("qs.question ILIKE :qq")
        params["qq"] = f"%{query_text}%"

    rows = db.execute(text(f"""
        SELECT
          qs.question_id,
          qs.description, 
          qs.category_id,
          cat.name AS category,
          COALESCE(qs.is_active, TRUE) AS is_active
        FROM questions qs
        JOIN category cat ON cat.category_id = qs.category_id
        WHERE {" AND ".join(where)}
        ORDER BY qs.question_id DESC
        LIMIT :limit OFFSET :offset
    """), params).mappings().all()
    return [dict(r) for r in rows]

def get_choices_for_questions(db: Session, ids: Iterable[int]) -> Dict[int, List[Dict[str, Any]]]:
    if not ids:
        return {}
    rows = db.execute(text("""
        SELECT question_id, choice_id, description, is_correct 
        FROM choice
        WHERE question_id = ANY(:ids)
        ORDER BY choice_id ASC
    """), {"ids": list(ids)}).mappings().all()
    by_q: Dict[int, List[Dict[str, Any]]] = {}
    for r in rows:
        by_q.setdefault(r["question_id"], []).append({
            "choiceId": r["choice_id"],
            "description": r["description"],
            "isCorrect": r["is_correct"],
            "isActive": r["is_active"],
        })
    return by_q

def get_question_header(db: Session, question_id: int) -> Optional[Dict[str, Any]]:
    r = db.execute(text("""
        SELECT qs.question_id, qs.description, qs.category_id, cat.name AS category, qs.is_active, 
               COALESCE(qs.is_active, TRUE) AS is_active
        FROM questions qs
        JOIN category cat ON cat.category_id = qs.category_id
        WHERE qs.question_id = :qid
    """), {"qid": question_id}).mappings().first()
    return dict(r) if r else None

def get_question_choices(db: Session, question_id: int) -> List[Dict[str, Any]]:
    rows = db.execute(text("""
        SELECT choice_id, description, is_correct  
        FROM choice WHERE question_id = :qid
        ORDER BY choice_id ASC
    """), {"qid": question_id}).mappings().all()
    return [dict(r) for r in rows]

def insert_question(db: Session, *, category_id: int, description: str) -> int:
    r = db.execute(text("""
        INSERT INTO questions(category_id, description, is_active)
        VALUES (:cid, :desc, TRUE)
        RETURNING question_id
    """), {"cid": category_id, "desc": description}).mappings().first()
    return int(r["question_id"])

def insert_choices(db: Session, *, question_id: int, choices: List[Dict[str, Any]]) -> None:
    db.execute(text("""
        INSERT INTO choice(question_id, description, is_correct)
        VALUES (:qid, :desc, :isc)
    """), [
        {"qid": question_id, "desc": c["description"], "isc": bool(c["isCorrect"])}
        for c in choices
    ])

def update_question_fields(
    db: Session,
    *,
    question_id: int,
    description: str,
    category_id: int,
    is_active: bool,
) -> None:
    db.execute(text("""
        UPDATE questions
           SET description = :desc,        
               category_id = :cid,
               is_active = :iact
         WHERE question_id = :qid
    """), {"desc": description, "cid": category_id, "iact": bool(is_active), "qid": question_id})

def clear_all_correct(db: Session, *, question_id: int) -> None:
    db.execute(text("UPDATE choice SET is_correct = FALSE WHERE question_id = :qid"), {"qid": question_id})

def upsert_choice(
    db: Session,
    *,
    question_id: int,
    choice_id: Optional[int],
    description: str,
    is_correct: bool,
) -> None:
    if choice_id is not None:
        # UPDATE existing
        db.execute(text("""
            UPDATE choice
               SET description = :desc,
                   is_correct  = :isc
             WHERE question_id = :qid AND choice_id = :cid
        """), {"qid": question_id, "cid": choice_id, "desc": description, "isc": bool(is_correct)})
    else:
        # INSERT new
        db.execute(text("""
            INSERT INTO choice (question_id, description, is_correct)
            VALUES (:qid, :desc, :isc)
        """), {"qid": question_id, "desc": description, "isc": bool(is_correct)})

def delete_choices(db: Session, *, question_id: int) -> None:
    db.execute(text("DELETE FROM choice WHERE question_id = :qid"), {"qid": question_id})

def set_question_status(db: Session, *, question_id: int, is_active: bool) -> Optional[Dict[str, Any]]:
    r = db.execute(text("""
        UPDATE questions SET is_active = :iact
        WHERE question_id = :qid
        RETURNING question_id, is_active
    """), {"iact": bool(is_active), "qid": question_id}).mappings().first()
    return dict(r) if r else None
