"""Admin-only analytics routes: weekly attendance/waste report and inventory stock management."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.database import get_db
from app.models.checkin import AttendanceStatus, Checkin
from app.models.forecast import Forecast
from app.models.inventory import InventoryItem
from app.models.leftover import Leftover
from app.models.meal import Meal
from app.models.user import Role, User
from app.schemas.report import (
    InventoryCreate,
    InventoryOut,
    InventoryReportOut,
    InventoryUpdate,
    WeeklyMealStat,
    WeeklyReportOut,
)

router = APIRouter(prefix="/reports", tags=["reports"])
admin_only = require_roles(Role.admin)


@router.get("/weekly", response_model=WeeklyReportOut)
def get_weekly_report(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
    _: User = Depends(admin_only),
) -> WeeklyReportOut:
    """Aggregate attendance, forecast accuracy, and leftover waste over the last N days (admin only)."""
    since_date = (datetime.now(timezone.utc) - timedelta(days=days - 1)).date()
    meals = list(
        db.scalars(
            select(Meal).where(Meal.date >= since_date).order_by(Meal.date.desc(), Meal.id.desc())
        )
    )
    meal_ids = [m.id for m in meals]

    checkins_by_meal: dict[int, list[Checkin]] = {mid: [] for mid in meal_ids}
    forecasts_by_meal: dict[int, Forecast] = {}
    leftovers_by_meal: dict[int, list[Leftover]] = {mid: [] for mid in meal_ids}

    if meal_ids:
        for c in db.scalars(select(Checkin).where(Checkin.meal_id.in_(meal_ids))):
            checkins_by_meal[c.meal_id].append(c)
        for f in db.scalars(select(Forecast).where(Forecast.meal_id.in_(meal_ids)).order_by(Forecast.id.asc())):
            forecasts_by_meal[f.meal_id] = f
        for lo in db.scalars(select(Leftover).where(Leftover.meal_id.in_(meal_ids))):
            leftovers_by_meal[lo.meal_id].append(lo)

    total_eating = 0
    total_skipping = 0
    total_cooked = 0.0
    total_leftover = 0.0
    confidences: list[float] = []
    meal_stats: list[WeeklyMealStat] = []

    for m in meals:
        c_list = checkins_by_meal[m.id]
        eating = sum(1 for c in c_list if c.status == AttendanceStatus.eating)
        skipping = sum(1 for c in c_list if c.status == AttendanceStatus.skipping)
        total_eating += eating
        total_skipping += skipping

        fc = forecasts_by_meal.get(m.id)
        if fc is not None:
            confidences.append(fc.confidence_score)

        lo_list = leftovers_by_meal[m.id]
        cooked = round(sum(lo.qty_cooked for lo in lo_list), 2)
        left = round(sum(lo.qty_left for lo in lo_list), 2)
        total_cooked += cooked
        total_leftover += left

        meal_stats.append(
            WeeklyMealStat(
                meal_id=m.id,
                date=m.date,
                meal_type=m.meal_type.value,
                eating_count=eating,
                skipping_count=skipping,
                predicted_headcount=fc.predicted if fc else None,
                confidence_score=fc.confidence_score if fc else None,
                qty_cooked=cooked,
                qty_left=left,
            )
        )

    total_responses = total_eating + total_skipping
    turnout_rate_pct = round((total_eating / total_responses) * 100, 1) if total_responses else 0.0
    avg_conf = round(sum(confidences) / len(confidences), 2) if confidences else None
    waste_pct = round((total_leftover / total_cooked) * 100, 1) if total_cooked > 0 else 0.0

    return WeeklyReportOut(
        days=days,
        total_meals=len(meals),
        total_eating=total_eating,
        total_skipping=total_skipping,
        turnout_rate_pct=turnout_rate_pct,
        avg_forecast_confidence=avg_conf,
        total_cooked=round(total_cooked, 2),
        total_leftover=round(total_leftover, 2),
        waste_pct=waste_pct,
        meals=meal_stats,
    )


@router.get("/inventory", response_model=InventoryReportOut)
def get_inventory_report(
    db: Session = Depends(get_db),
    _: User = Depends(admin_only),
) -> InventoryReportOut:
    """Return all kitchen inventory stock items with low-stock and category summaries (admin only)."""
    items = list(db.scalars(select(InventoryItem).order_by(InventoryItem.category.asc(), InventoryItem.name.asc())))
    categories: dict[str, int] = {}
    low_stock_count = 0
    for item in items:
        categories[item.category] = categories.get(item.category, 0) + 1
        if item.is_low_stock:
            low_stock_count += 1

    return InventoryReportOut(
        total_items=len(items),
        low_stock_count=low_stock_count,
        categories=categories,
        items=[InventoryOut.model_validate(i) for i in items],
    )


@router.post("/inventory", response_model=InventoryOut, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    data: InventoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only),
) -> InventoryItem:
    """Add a new stock item to kitchen inventory (admin only)."""
    clean_name = data.name.strip()
    existing = db.scalar(select(InventoryItem).where(InventoryItem.name.ilike(clean_name)))
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "An inventory item with this name already exists")

    item = InventoryItem(
        name=clean_name,
        category=data.category.strip(),
        quantity=data.quantity,
        unit=data.unit.strip(),
        reorder_level=data.reorder_level,
        updated_by=admin.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/inventory/{item_id}", response_model=InventoryOut)
def update_inventory_item(
    item_id: int,
    data: InventoryUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only),
) -> InventoryItem:
    """Update stock quantity, unit, category, or reorder threshold (admin only)."""
    item = db.get(InventoryItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Inventory item not found")

    if data.category is not None:
        item.category = data.category.strip()
    if data.quantity is not None:
        item.quantity = data.quantity
    if data.unit is not None:
        item.unit = data.unit.strip()
    if data.reorder_level is not None:
        item.reorder_level = data.reorder_level
    item.updated_by = admin.id

    db.commit()
    db.refresh(item)
    return item


@router.delete("/inventory/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(admin_only),
) -> None:
    """Delete an inventory stock item (admin only)."""
    item = db.get(InventoryItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Inventory item not found")
    db.delete(item)
    db.commit()
