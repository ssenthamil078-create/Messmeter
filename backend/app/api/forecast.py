"""Forecast API routes: GET /api/forecast/{meal_id} and recalculate endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.meal import Meal
from app.schemas.forecast import ForecastOut
from app.services.forecast import generate_meal_forecast

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("/{meal_id}", response_model=ForecastOut)
def get_meal_forecast(
    meal_id: int,
    db: Session = Depends(get_db),
) -> ForecastOut:
    """Get the latest predicted headcount and portion plan for a meal."""
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Meal #{meal_id} not found")

    try:
        return generate_meal_forecast(meal_id, db)
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to calculate forecast: {str(e)}")


@router.post("/{meal_id}/recalculate", response_model=ForecastOut)
def recalculate_meal_forecast(
    meal_id: int,
    db: Session = Depends(get_db),
) -> ForecastOut:
    """Force recomputation of the forecast using the latest live student check-ins."""
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Meal #{meal_id} not found")

    return generate_meal_forecast(meal_id, db)
