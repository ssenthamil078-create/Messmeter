"""Unit & integration tests for Module M7 (Headcount Forecast) and Module M8 (Portion Planner)."""
from datetime import date, datetime, timedelta, timezone

from app.api import forecast as forecast_api
from app.models.checkin import AttendanceStatus, Checkin
from app.models.meal import Meal, MealType
from app.models.user import Role, User
from app.security import hash_password
from app.services.portion_planner import calculate_portion_plan, parse_portion_string


def test_parse_portion_string():
    assert parse_portion_string("0.25 kg") == (0.25, "kg")
    assert parse_portion_string("3 pcs") == (3.0, "pcs")
    assert parse_portion_string("200ml") == (200.0, "ml")
    assert parse_portion_string("invalid") == (1.0, "portion")


def test_calculate_portion_plan():
    sizes = {"Idli": "3 pcs", "Sambar": "0.15 L"}
    plan = calculate_portion_plan(sizes, ["Idli", "Sambar"], predicted=100, low=90, high=110)
    assert len(plan) == 2
    assert plan[0].dish == "Idli"
    assert plan[0].recommended_total == "300 pcs"
    assert plan[0].min_total == "270 pcs"
    assert plan[0].max_total == "330 pcs"
    assert plan[1].dish == "Sambar"
    assert plan[1].recommended_total == "15 L"


def test_forecast_generation_and_recalculation(db):
    # Create 4 active students
    students = []
    for i in range(4):
        u = User(
            name=f"Student {i}",
            email=f"fstudent{i}@example.com",
            password_hash=hash_password("password123"),
            role=Role.student,
            is_active=True,
        )
        db.add(u)
        students.append(u)
    db.commit()

    meal = Meal(
        date=date.today(),
        meal_type=MealType.lunch,
        dishes=["Rice", "Dal"],
        portion_sizes={"Rice": "0.25 kg", "Dal": "0.15 L"},
        cutoff_time=datetime.now(timezone.utc) + timedelta(hours=2),
    )
    db.add(meal)
    db.commit()

    # 2 eating, 1 skipping, 1 non-responder
    db.add(Checkin(user_id=students[0].id, meal_id=meal.id, status=AttendanceStatus.eating))
    db.add(Checkin(user_id=students[1].id, meal_id=meal.id, status=AttendanceStatus.eating))
    db.add(Checkin(user_id=students[2].id, meal_id=meal.id, status=AttendanceStatus.skipping))
    db.commit()

    fc = forecast_api.get_meal_forecast(meal.id, db=db)
    assert fc.meal_id == meal.id
    assert fc.confirmed_eating == 2
    assert fc.confirmed_skipping == 1
    assert fc.non_responders >= 1
    assert fc.predicted >= fc.confirmed_eating
    assert fc.low <= fc.predicted <= fc.high
    assert 0.5 <= fc.confidence_score <= 1.0
    assert len(fc.portion_targets) == 2

    # 4th student responds eating -> recalculation updates forecast
    db.add(Checkin(user_id=students[3].id, meal_id=meal.id, status=AttendanceStatus.eating))
    db.commit()

    fc2 = forecast_api.recalculate_meal_forecast(meal.id, db=db)
    assert fc2.confirmed_eating == 3
    assert fc2.predicted >= 3
