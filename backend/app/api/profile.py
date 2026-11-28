# backend/app/api/profile.py
"""API routes for the currently‑authenticated user's profile.
Provides a read‑only view and an update endpoint for name, email and password.
All routes require a valid JWT (handled by `get_current_user`).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.security import hash_password, verify_password

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("", response_model=UserOut)
def read_profile(current_user: User = Depends(get_current_user)) -> User:
    """Return the logged‑in user's profile information."""
    return current_user

@router.patch("", response_model=UserOut)
def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    """Allow the user to update their name, email or password.
    Email changes are lower‑cased and must be unique.
    Password is hashed before storage.
    """
    if data.email is not None:
        email = data.email.lower()
        # Ensure no other user uses this email
        existing = db.scalar(
            db.query(User).filter(User.email == email, User.id != current_user.id).exists()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another account already uses this email",
            )
        current_user.email = email

    if data.name is not None:
        current_user.name = data.name.strip()

    if data.password is not None:
        # Verify the new password meets basic criteria (optional)
        if len(data.password) < 8:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Password must be at least 8 characters long",
            )
        current_user.password_hash = hash_password(data.password)

    db.commit()
    db.refresh(current_user)
    return current_user
