"""Check-in routes: students submit eating/skipping choice before cut-off time."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.checkin import AttendanceStatus, Checkin
from app.models.meal import Meal
from app.models.user import Role, User
from app.schemas.checkin import CheckinCreate, CheckinOut

router = APIRouter(prefix="/checkins", tags=["checkins"])


@router.post("", response_model=CheckinOut, status_code=status.HTTP_200_OK)
def submit_checkin(
    data: CheckinCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Checkin:
    """Submit or update meal check-in attendance choice (eating or skipping)."""
    # Only students and admins (for testing) can check in
    if user.role not in (Role.student, Role.admin):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Only students can mark meal check-ins",
        )

    meal = db.get(Meal, data.meal_id)
    if meal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meal not found")

    if not meal.is_open:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Check-in for this meal is closed (cut-off time has passed)",
        )

    # Upsert check-in
    checkin = db.scalar(
        select(Checkin).where(
            Checkin.user_id == user.id,
            Checkin.meal_id == data.meal_id,
        )
    )
    if checkin:
        checkin.status = data.status
        checkin.updated_at = datetime.now(timezone.utc)
    else:
        checkin = Checkin(
            user_id=user.id,
            meal_id=data.meal_id,
            status=data.status,
        )
        db.add(checkin)

    db.commit()
    db.refresh(checkin)
    return checkin


@router.get("/my", response_model=list[CheckinOut])
def get_my_checkins(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Checkin]:
    """Get all check-in responses for the current user."""
    return list(
        db.scalars(
            select(Checkin)
            .where(Checkin.user_id == user.id)
            .order_by(Checkin.created_at.desc())
        )
    )


@router.get("/summary/{meal_id}")
def get_meal_attendance_summary(
    meal_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    """Return counts of eating, skipping, and total responses for a meal."""
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meal not found")

    eating_count = db.scalar(
        select(func.count(Checkin.id)).where(
            Checkin.meal_id == meal_id,
            Checkin.status == AttendanceStatus.eating,
        )
    ) or 0

    skipping_count = db.scalar(
        select(func.count(Checkin.id)).where(
            Checkin.meal_id == meal_id,
            Checkin.status == AttendanceStatus.skipping,
        )
    ) or 0

    total_students = db.scalar(
        select(func.count(User.id)).where(
            User.role == Role.student,
            User.is_active == True,
        )
    ) or 0

    not_responded = max(0, total_students - (eating_count + skipping_count))

    return {
        "meal_id": meal_id,
        "eating": eating_count,
        "skipping": skipping_count,
        "not_responded": not_responded,
        "total_responded": eating_count + skipping_count,
        "total_students": total_students,
        "is_open": meal.is_open,
    }
