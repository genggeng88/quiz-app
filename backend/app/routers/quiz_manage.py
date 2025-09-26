# app/routers/quizManage.py
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.core.security import require_auth
from app.services import quiz_manage as qm_svc
from app.core.security import require_admin

router = APIRouter(prefix="/admin/quizzes", tags=["admin:quizzes"])

@router.get("", response_model=dict, dependencies=[Depends(require_admin)])
def list_quizzes(
    db: Session = Depends(get_db),
    categoryId: Optional[int] = Query(None),
    userId: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    data = qm_svc.admin_list_quizzes(
        db,
        category_id=categoryId,
        user_id=userId,
        limit=limit,
        offset=offset,
    )
    # If you want pagination meta, uncomment the next two lines and include it in the response
    # total = qm_svc.admin_count_quizzes(db, category_id=categoryId, user_id=userId)
    # return {"ok": True, "data": data, "meta": {"total": total, "limit": limit, "offset": offset}}
    return {"ok": True, "data": data}
