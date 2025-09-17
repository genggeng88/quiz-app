# app/services/quiz_manage.py
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.crud import quiz_manage as qm_crud

def admin_list_quizzes(
    db: Session,
    *,
    category_id: Optional[int],
    user_id: Optional[int],
    limit: int,
    offset: int,
) -> List[Dict[str, Any]]:
    return qm_crud.list_quizzes(
        db,
        category_id=category_id,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )

# (Optional) expose total count for pagination
def admin_count_quizzes(
    db: Session,
    *,
    category_id: Optional[int],
    user_id: Optional[int],
) -> int:
    return qm_crud.count_quizzes(db, category_id=category_id, user_id=user_id)
