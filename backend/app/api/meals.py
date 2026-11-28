"""Meal and menu routes: create/list meals (admin) and GET /api/meals/today for all users."""
from datetime import date, datetime, time, timedelta, timezone
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

# Rotating daily menus (indexed by weekday 0=Mon .. 6=Sun) so each day gets fresh meals.
DAILY_MENU_ROTATION = [
    {
        MealType.breakfast: (
            ["Idli (4 pcs)", "Medu Vada (1 pc)", "Sambar", "Coconut Chutney", "Filter Coffee"],
            {"Idli (4 pcs)": "4 pcs", "Medu Vada (1 pc)": "1 pc", "Sambar": "0.15 L", "Filter Coffee": "0.10 L"},
        ),
        MealType.lunch: (
            ["Steamed Basmati Rice", "South Indian Sambar", "Vegetable Kurma", "Curd / Buttermilk", "Appalam"],
            {"Steamed Basmati Rice": "0.25 kg", "South Indian Sambar": "0.15 L", "Vegetable Kurma": "0.12 kg", "Curd / Buttermilk": "0.10 L"},
        ),
        MealType.dinner: (
            ["Chapati (3 pcs)", "Paneer Butter Masala", "Jeera Rice", "Yellow Dal Tadka", "Gulab Jamun"],
            {"Chapati (3 pcs)": "3 pcs", "Paneer Butter Masala": "0.15 kg", "Jeera Rice": "0.15 kg", "Yellow Dal Tadka": "0.12 L"},
        ),
    },
    {
        MealType.breakfast: (
            ["Masala Dosa", "Tomato Chutney", "Sambar", "Boiled Egg / Sprouts", "Tea / Milk"],
            {"Masala Dosa": "2 pcs", "Sambar": "0.15 L", "Tomato Chutney": "0.05 kg", "Tea / Milk": "0.15 L"},
        ),
        MealType.lunch: (
            ["Jeera Rice", "Rajma Masala", "Aloo Gobi", "Cucumber Raita", "Salad"],
            {"Jeera Rice": "0.25 kg", "Rajma Masala": "0.18 L", "Aloo Gobi": "0.12 kg", "Cucumber Raita": "0.10 L"},
        ),
        MealType.dinner: (
            ["Phulka (3 pcs)", "Kadai Vegetable", "Steamed Rice", "Dal Fry", "Fruit Custard"],
            {"Phulka (3 pcs)": "3 pcs", "Kadai Vegetable": "0.15 kg", "Steamed Rice": "0.15 kg", "Dal Fry": "0.12 L"},
        ),
    },
    {
        MealType.breakfast: (
            ["Pongal", "Medu Vada", "Coconut Chutney", "Sambar", "Filter Coffee"],
            {"Pongal": "0.25 kg", "Medu Vada": "1 pc", "Sambar": "0.15 L", "Filter Coffee": "0.10 L"},
        ),
        MealType.lunch: (
            ["Veg Pulao", "Dal Makhani", "Bhindi Fry", "Boondi Raita", "Papad"],
            {"Veg Pulao": "0.25 kg", "Dal Makhani": "0.15 L", "Bhindi Fry": "0.10 kg", "Boondi Raita": "0.10 L"},
        ),
        MealType.dinner: (
            ["Chapati (3 pcs)", "Chana Masala", "Lemon Rice", "Rasam", "Payasam"],
            {"Chapati (3 pcs)": "3 pcs", "Chana Masala": "0.16 kg", "Lemon Rice": "0.18 kg", "Rasam": "0.12 L"},
        ),
    },
    {
        MealType.breakfast: (
            ["Poori (3 pcs)", "Potato Masala", "Rava Kesari", "Tea / Coffee"],
            {"Poori (3 pcs)": "3 pcs", "Potato Masala": "0.15 kg", "Rava Kesari": "0.08 kg", "Tea / Coffee": "0.15 L"},
        ),
        MealType.lunch: (
            ["Steamed Rice", "Drumstick Sambar", "Cabbage Poriyal", "Rasam", "Buttermilk"],
            {"Steamed Rice": "0.25 kg", "Drumstick Sambar": "0.15 L", "Cabbage Poriyal": "0.12 kg", "Buttermilk": "0.15 L"},
        ),
        MealType.dinner: (
            ["Parotta (2 pcs)", "Veg Salna", "Curd Rice", "Pickle", "Banana"],
            {"Parotta (2 pcs)": "2 pcs", "Veg Salna": "0.18 L", "Curd Rice": "0.18 kg"},
        ),
    },
    {
        MealType.breakfast: (
            ["Rava Upma", "Medu Vada", "Peanut Chutney", "Sambar", "Coffee"],
            {"Rava Upma": "0.22 kg", "Medu Vada": "1 pc", "Sambar": "0.15 L", "Coffee": "0.10 L"},
        ),
        MealType.lunch: (
            ["Vegetable Biryani", "Onion Raita", "Brinjal Gravy", "Boiled Egg / Paneer", "Sweet"],
            {"Vegetable Biryani": "0.30 kg", "Onion Raita": "0.10 L", "Brinjal Gravy": "0.12 L"},
        ),
        MealType.dinner: (
            ["Chapati (3 pcs)", "Matar Paneer", "Steamed Rice", "Moong Dal", "Ice Cream"],
            {"Chapati (3 pcs)": "3 pcs", "Matar Paneer": "0.15 kg", "Steamed Rice": "0.15 kg", "Moong Dal": "0.12 L"},
        ),
    },
    {
        MealType.breakfast: (
            ["Aloo Paratha (2 pcs)", "Curd", "Pickle", "Mint Chutney", "Masala Chai"],
            {"Aloo Paratha (2 pcs)": "2 pcs", "Curd": "0.12 kg", "Masala Chai": "0.15 L"},
        ),
        MealType.lunch: (
            ["Steamed Rice", "Karakozhambu", "Beans Poriyal", "Dal Tadka", "Curd"],
            {"Steamed Rice": "0.25 kg", "Karakozhambu": "0.15 L", "Beans Poriyal": "0.10 kg", "Curd": "0.10 L"},
        ),
        MealType.dinner: (
            ["Ghee Dosa (2 pcs)", "Vegetable Kurma", "Tomato Chutney", "Badam Milk"],
            {"Ghee Dosa (2 pcs)": "2 pcs", "Vegetable Kurma": "0.15 L", "Badam Milk": "0.15 L"},
        ),
    },
    {
        MealType.breakfast: (
            ["Chole Bhature", "Onion Salad", "Sweet Lassi", "Filter Coffee"],
            {"Chole Bhature": "2 pcs", "Sweet Lassi": "0.20 L", "Filter Coffee": "0.10 L"},
        ),
        MealType.lunch: (
            ["Special Veg Thali", "Paneer Tikka Masala", "Jeera Pulao", "Dal", "Gulab Jamun"],
            {"Jeera Pulao": "0.25 kg", "Paneer Tikka Masala": "0.15 kg", "Dal": "0.12 L"},
        ),
        MealType.dinner: (
            ["Chapati (3 pcs)", "Mixed Veg Curry", "Steamed Rice", "Rasam", "Fruit Bowl"],
            {"Chapati (3 pcs)": "3 pcs", "Mixed Veg Curry": "0.15 kg", "Steamed Rice": "0.15 kg"},
        ),
    },
]

DEFAULT_CUTOFF_HOURS = {
    MealType.breakfast: time(9, 0),
    MealType.lunch: time(13, 0),
    MealType.dinner: time(20, 30),
}


def ensure_daily_meals(db: Session, target_date: date) -> list[Meal]:
    """Ensure breakfast, lunch, and dinner exist for target_date."""
    existing = list(db.scalars(select(Meal).where(Meal.date == target_date)))
    existing_types = {m.meal_type for m in existing}
    local_tz = datetime.now().astimezone().tzinfo or timezone.utc
    day_menu = DAILY_MENU_ROTATION[target_date.weekday() % len(DAILY_MENU_ROTATION)]

    created = False
    for m_type in (MealType.breakfast, MealType.lunch, MealType.dinner):
        if m_type in existing_types:
            continue
        dishes, portions = day_menu[m_type]
        local_cutoff = datetime.combine(target_date, DEFAULT_CUTOFF_HOURS[m_type], tzinfo=local_tz)
        meal = Meal(
            date=target_date,
            meal_type=m_type,
            menu_items=json.dumps(dishes),
            portion_sizes=json.dumps(portions),
            cutoff_time=local_cutoff.astimezone(timezone.utc),
        )
        db.add(meal)
        created = True

    if created:
        db.commit()
        existing = list(db.scalars(select(Meal).where(Meal.date == target_date)))

    order = {MealType.breakfast: 0, MealType.lunch: 1, MealType.dinner: 2}
    existing.sort(key=lambda m: order.get(m.meal_type, 99))
    return existing


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
    """Get today's meals (auto-generating today's daily menu if missing) with the user's check-in status."""
    today = datetime.now().astimezone().date()
    meals = ensure_daily_meals(db, today)

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
