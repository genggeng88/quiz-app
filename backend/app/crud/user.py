# app/crud/user.py
from sqlalchemy.orm import Session
from sqlalchemy import select, update, text
from typing import List, Dict, Any, Optional
from app.models.models import User  # adjust import to your model path

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)

def create_user(
    db: Session,
    *,
    email: str,
    password_hash: str,
    firstname: str,
    lastname: str,
    is_active: bool,
    is_admin: bool,
) -> User:
    u = User(
        email=email,
        password_hash=password_hash,
        firstname=firstname,
        lastname=lastname,
        is_active=is_active,
        is_admin=is_admin,
    )
    db.add(u)
    db.flush()   # assigns PK
    db.refresh(u)
    return u

def set_user_status(db: Session, user_id: int, is_active: bool) -> Optional[User]:
    db.execute(
        update(User)
        .where(User.user_id == user_id)
        .values(is_active=is_active)
    )
    db.flush()
    return db.get(User, user_id)

def list_users(db: Session) -> List[Dict[str, Any]]:
    rows = db.execute(text("""
        SELECT
          u.user_id,
          u.email,
          (u.firstname || ' ' || u.lastname) AS full_name,
          CASE WHEN u.is_active THEN 'active' ELSE 'suspended' END AS status
        FROM users u
        WHERE u.is_admin = FALSE         
        ORDER BY full_name ASC, email ASC
    """)).mappings().all()
    return [dict(r) for r in rows]

def update_user_status(db: Session, user_id: int, status: str) -> Optional[Dict[str, Any]]:
    """
    Toggle a normal user's active state.
    - status: "active" or "suspended"
    - returns a dict with user_id, email, full_name, role, status (string)
    - does NOT allow updating admins (is_admin = FALSE filter)
    """
    is_active = (status.lower() == "active")

    row = db.execute(text("""
        UPDATE users
        SET is_active = :is_active
        WHERE user_id = :uid
          AND is_admin = FALSE
        RETURNING
          user_id,
          email,
          (firstname || ' ' || lastname) AS full_name,
          CASE WHEN is_admin  THEN 'admin' ELSE 'user' END AS role,
          CASE WHEN is_active THEN 'active' ELSE 'suspended' END AS status
    """), {"is_active": is_active, "uid": user_id}).mappings().first()

    return dict(row) if row else None