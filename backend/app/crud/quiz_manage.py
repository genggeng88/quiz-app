# app/crud/quiz_manage.py
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text

def list_quizzes(
    db: Session,
    *,
    category_id: Optional[int],
    user_id: Optional[int],
    limit: int,
    offset: int,
) -> List[Dict[str, Any]]:
    where = ["1=1"]
    params: Dict[str, Any] = {"limit": limit, "offset": offset}
    if category_id is not None:
        where.append("q.category_id = :cid")
        params["cid"] = category_id
    if user_id is not None:
        where.append("q.user_id = :uid")
        params["uid"] = user_id

    sql = f"""
      SELECT
        q.quiz_id,
        q.time_start,
        q.time_end,
        q.correct_rate,
        u.user_id,
        concat_ws(' ', u.firstname, u.lastname) AS user_full_name,  -- ← fix
        u.email AS user_email,
        c.category_id,
        c.name AS category,
        qc.question_count
      FROM quizzes q                              
      JOIN users u ON u.user_id = q.user_id
      JOIN category c ON c.category_id = q.category_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS question_count
        FROM quizquestion qq
        WHERE qq.quiz_id = q.quiz_id
      ) qc ON TRUE
      WHERE 1=1
      ORDER BY q.time_start DESC
      LIMIT :limit OFFSET :offset;
    """
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]

# (Optional) If you want server-side pagination metadata, expose a count:
def count_quizzes(
    db: Session,
    *,
    category_id: Optional[int],
    user_id: Optional[int],
) -> int:
    where = ["1=1"]
    params: Dict[str, Any] = {}
    if category_id is not None:
        where.append("category_id = :cid")
        params["cid"] = category_id
    if user_id is not None:
        where.append("user_id = :uid")
        params["uid"] = user_id

    sql = f"""
      SELECT COUNT(*)::int AS n
      FROM quizzes
      WHERE {" AND ".join(where)}
    """
    return int(db.execute(text(sql), params).scalar_one())
