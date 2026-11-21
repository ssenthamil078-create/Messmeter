"""User management routes (admin only): create, list, activate / deactivate accounts."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.database import get_db
from app.models.user import Role, User
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])
admin_only = require_roles(Role.admin)


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(admin_only)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)))


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, db: Session = Depends(get_db), _: User = Depends(admin_only)) -> User:
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "A user with this email already exists")
    user = User(name=data.name, email=email, password_hash=hash_password(data.password), role=data.role)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # two admins created the same email at the same moment
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "A user with this email already exists") from None
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
def set_user_active(user_id: int, data: UserUpdate, db: Session = Depends(get_db),
                    admin: User = Depends(admin_only)) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.id == admin.id and not data.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot deactivate your own account")
    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user
