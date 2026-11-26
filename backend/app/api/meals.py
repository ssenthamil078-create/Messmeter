"""Meal and menu routes: create/list meals (admin) and GET /api/meals/today for all users."""
from datetime import date, datetime, timezone
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.database import get_db
from app.models.checkin import Checkin
from app.models.meal import Meal, MealType
from app.models.user import Role, User
from app.schemas.meal import MealCreate, MealOut, MealUpdate, MealWithCheckin

router = APIRouter(prefix="/meals", tags=["meals"])
admin_only = require_roles(Role.admin)


@router.get("", response_model=list[MealOut])
def list_meals(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[MealOut]:
    """List all scheduled meals ordered by date descending."""
    meals = list(db.scalars(select(Meal).order_by(Meal.date.desc(), Meal.id.desc())))
    return [MealOut.from_model(m) for m in meals]


@router.get("/today", response_model=list[MealWithCheckin])
def get_today_meals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MealWithCheckin]:
    """Get today's meals with the current user's check-in status (if any)."""
    today = datetime.now(timezone.utc).date()
    # Also fetch upcoming meals for today or near future
    meals = list(db.scalars(select(Meal).where(Meal.date >= today).order_by(Meal.date.asc(), Meal.cutoff_time.asc())))
    if not meals:
        # Fallback to today's date exact or recent
        meals = list(db.scalars(select(Meal).order_by(Meal.date.desc(), Meal.id.desc()).limit(5)))

    # Fetch user's checkins for these meals
    meal_ids = [m.id for m in meals]
    user_checkins = {}
    if meal_ids:
        checkins = list(
            db.scalars(
                select(Checkin).where(
                    Checkin.user_id == current_user.id,
                    Checkin.meal_id.in_(meal_ids),
                )
            )
        )
        user_checkins = {c.meal_id: c.status.value for c in checkins}

    results = []
    for m in meals:
        base = MealOut.from_model(m)
        status_val = user_checkins.get(m.id)
        results.append(
            MealWithCheckin(
                **base.model_dump(),
                user_status=status_val,
            )
        )
    return results


@router.post("", response_model=MealOut, status_code=status.HTTP_201_CREATED)
def create_meal(
    data: MealCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_only),
) -> MealOut:
    """Create a new meal with dishes, portion sizes, and cut-off time (admin only)."""
    # Verify cut-off time is timezone-aware
    cutoff = data.cutoff_time
    if cutoff.tzinfo is None:
        cutoff = cutoff.replace(tzinfo=timezone.utc)

    # Check if duplicate meal already exists for date + meal_type
    existing = db.scalar(select(Meal).where(Meal.date == data.date, Meal.meal_type == data.meal_type))
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"A {data.meal_type.value} meal is already scheduled for {data.date}",
        )

    meal = Meal(
        date=data.date,
        meal_type=data.meal_type,
        menu_items=json.dumps(data.dishes),
        portion_sizes=json.dumps(data.portion_sizes),
        cutoff_time=cutoff,
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return MealOut.from_model(meal)


@router.get("/{meal_id}", response_model=MealOut)
def get_meal(meal_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> MealOut:
    """Get single meal details."""
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meal not found")
    return MealOut.from_model(meal)


@router.patch("/{meal_id}", response_model=MealOut)
def update_meal(
    meal_id: int,
    data: MealUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_only),
) -> MealOut:
    """Update an existing meal's dishes, portion sizes, or cut-off time (admin only)."""
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meal not found")

    if data.dishes is not None:
        meal.menu_items = json.dumps(data.dishes)
    if data.portion_sizes is not None:
        meal.portion_sizes = json.dumps(data.portion_sizes)
    if data.cutoff_time is not None:
        cutoff = data.cutoff_time
        if cutoff.tzinfo is None:
            cutoff = cutoff.replace(tzinfo=timezone.utc)
        meal.cutoff_time = cutoff

    db.commit()
    db.refresh(meal)
    return MealOut.from_model(meal)


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(meal_id: int, db: Session = Depends(get_db), _: User = Depends(admin_only)) -> None:
    """Delete a meal (admin only)."""
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meal not found")
    db.delete(meal)
    db.commit()
