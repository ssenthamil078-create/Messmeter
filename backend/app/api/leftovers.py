"""Leftover routes: full CRUD for tracking cooked vs leftover quantities per meal dish (staff/admin)."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.database import get_db
from app.models.leftover import Leftover
from app.models.meal import Meal
from app.models.user import Role, User
from app.schemas.leftover import LeftoverCreate, LeftoverOut, LeftoverUpdate

router = APIRouter(prefix="/leftovers", tags=["leftovers"])
staff_or_admin = require_roles(Role.staff, Role.admin)


@router.get("", response_model=list[LeftoverOut])
def list_leftovers(
    meal_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(staff_or_admin),
) -> list[Leftover]:
    """Read leftover records, optionally filtered by meal_id."""
    stmt = select(Leftover).order_by(Leftover.created_at.desc(), Leftover.id.desc())
    if meal_id is not None:
        stmt = stmt.where(Leftover.meal_id == meal_id)
    return list(db.scalars(stmt))


@router.post("", response_model=LeftoverOut, status_code=status.HTTP_201_CREATED)
def create_leftover(
    data: LeftoverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_or_admin),
) -> Leftover:
    """Create a new leftover entry for a scheduled meal."""
    meal = db.get(Meal, data.meal_id)
    if meal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meal not found")

    record = Leftover(
        meal_id=data.meal_id,
        dish=data.dish,
        qty_cooked=data.qty_cooked,
        qty_left=data.qty_left,
        unit=data.unit,
        recorded_by=current_user.id,
        notes=data.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/{leftover_id}", response_model=LeftoverOut)
def update_leftover(
    leftover_id: int,
    data: LeftoverUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(staff_or_admin),
) -> Leftover:
    """Update an existing leftover record."""
    record = db.get(Leftover, leftover_id)
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leftover record not found")

    new_cooked = data.qty_cooked if data.qty_cooked is not None else record.qty_cooked
    new_left = data.qty_left if data.qty_left is not None else record.qty_left
    if new_left > new_cooked:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "qty_left cannot exceed qty_cooked")

    record.qty_cooked = new_cooked
    record.qty_left = new_left
    if data.unit is not None:
        record.unit = data.unit.strip()
    if data.notes is not None:
        record.notes = data.notes

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{leftover_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leftover(
    leftover_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(staff_or_admin),
) -> None:
    """Delete a leftover record."""
    record = db.get(Leftover, leftover_id)
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leftover record not found")
    db.delete(record)
    db.commit()
