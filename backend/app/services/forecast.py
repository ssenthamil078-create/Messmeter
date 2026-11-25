"""Headcount forecast service: baseline algorithm combining confirmed turnouts with estimated non-responders."""
from datetime import datetime, timezone
import json
import math

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.checkin import AttendanceStatus, Checkin
from app.models.forecast import Forecast
from app.models.meal import Meal, MealType
from app.models.user import Role, User
from app.schemas.forecast import ForecastOut
from app.services.portion_planner import calculate_portion_plan

# Empirical baseline turnout prior by meal type and day of week (0=Monday, 6=Sunday)
DEFAULT_PRIORS = {
    MealType.breakfast: {"weekday": 0.60, "weekend": 0.40},
    MealType.lunch: {"weekday": 0.75, "weekend": 0.50},
    MealType.dinner: {"weekday": 0.70, "weekend": 0.45},
}


def get_non_responder_probability(meal: Meal, db: Session) -> float:
    """Calculate non-responder eating probability based on historical data or baseline prior."""
    # Day of week: 5=Saturday, 6=Sunday
    is_weekend = meal.date.weekday() >= 5
    priors = DEFAULT_PRIORS.get(meal.meal_type, {"weekday": 0.65, "weekend": 0.45})
    baseline = priors["weekend"] if is_weekend else priors["weekday"]

    # Check past meals of same type for historical average
    past_meals = list(
        db.scalars(
            select(Meal)
            .where(
                Meal.meal_type == meal.meal_type,
                Meal.date < meal.date,
            )
            .order_by(Meal.date.desc())
            .limit(5)
        )
    )

    if not past_meals:
        return baseline

    # If historical data exists, blend 70% historical + 30% prior
    rates = []
    for pm in past_meals:
        eating = db.scalar(
            select(func.count(Checkin.id)).where(
                Checkin.meal_id == pm.id,
                Checkin.status == AttendanceStatus.eating,
            )
        ) or 0
        total_students = db.scalar(
            select(func.count(User.id)).where(
                User.role == Role.student,
                User.is_active == True,
            )
        ) or 1
        rates.append(eating / total_students)

    if rates:
        hist_avg = sum(rates) / len(rates)
        return round(0.70 * hist_avg + 0.30 * baseline, 3)

    return baseline


def generate_meal_forecast(meal_id: int, db: Session) -> ForecastOut:
    """Generate or retrieve headcount forecast and portion plan for a meal."""
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise ValueError(f"Meal #{meal_id} not found")

    # 1. Total active students
    total_students = db.scalar(
        select(func.count(User.id)).where(
            User.role == Role.student,
            User.is_active == True,
        )
    ) or 0

    # 2. Confirmed check-ins
    confirmed_eating = db.scalar(
        select(func.count(Checkin.id)).where(
            Checkin.meal_id == meal_id,
            Checkin.status == AttendanceStatus.eating,
        )
    ) or 0

    confirmed_skipping = db.scalar(
        select(func.count(Checkin.id)).where(
            Checkin.meal_id == meal_id,
            Checkin.status == AttendanceStatus.skipping,
        )
    ) or 0

    # 3. Non-responders
    total_responded = confirmed_eating + confirmed_skipping
    non_responders = max(0, total_students - total_responded)

    # 4. Estimation
    p_attend = get_non_responder_probability(meal, db)
    estimated_eaters = round(non_responders * p_attend)

    predicted = confirmed_eating + estimated_eaters

    # 5. Confidence range (tighter interval as response rate rises)
    response_rate = (total_responded / total_students) if total_students > 0 else 1.0
    margin = 0.20 * (1.0 - response_rate)

    low_p = max(0.05, p_attend - margin)
    high_p = min(0.95, p_attend + margin)

    low = confirmed_eating + round(non_responders * low_p)
    high = confirmed_eating + round(non_responders * high_p)

    low = min(low, predicted)
    high = max(high, predicted)
    confidence_score = round(0.70 + 0.30 * response_rate, 2)

    # 6. Portion Targets
    portion_targets = calculate_portion_plan(
        meal.portions,
        meal.dishes,
        predicted,
        low,
        high,
    )

    # 7. Persist to Forecasts table (upsert latest forecast)
    forecast_record = db.scalar(select(Forecast).where(Forecast.meal_id == meal_id))
    portion_json = json.dumps([t.model_dump() for t in portion_targets])

    if forecast_record:
        forecast_record.predicted = predicted
        forecast_record.low = low
        forecast_record.high = high
        forecast_record.confidence_score = confidence_score
        forecast_record.portion_plan = portion_json
    else:
        forecast_record = Forecast(
            meal_id=meal_id,
            predicted=predicted,
            low=low,
            high=high,
            confidence_score=confidence_score,
            portion_plan=portion_json,
            model_version="baseline-v1",
        )
        db.add(forecast_record)

    db.commit()
    db.refresh(forecast_record)

    return ForecastOut(
        id=forecast_record.id,
        meal_id=meal_id,
        predicted=predicted,
        low=low,
        high=high,
        confidence_score=confidence_score,
        confirmed_eating=confirmed_eating,
        confirmed_skipping=confirmed_skipping,
        non_responders=non_responders,
        estimated_non_responder_eaters=estimated_eaters,
        portion_targets=portion_targets,
        model_version=forecast_record.model_version,
        created_at=forecast_record.created_at,
    )
