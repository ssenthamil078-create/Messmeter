"""Tests for Meal management (Task MEAL-1 to MEAL-5)."""
from datetime import date, datetime, timedelta, timezone

import pytest
from app.models.meal import Meal, MealType
from app.models.user import Role


def sample_meal_payload(offset_hours: int = 4, meal_type: str = "dinner"):
    cutoff = datetime.now(timezone.utc) + timedelta(hours=offset_hours)
    return {
        "date": str(cutoff.date()),
        "meal_type": meal_type,
        "dishes": ["Chapati", "Paneer Butter Masala", "Jeera Rice", "Dal Tadka"],
        "portion_sizes": {
            "Chapati": "3 pieces",
            "Paneer Butter Masala": "0.15 kg",
            "Jeera Rice": "0.20 kg",
            "Dal Tadka": "0.15 L",
        },
        "cutoff_time": cutoff.isoformat(),
    }


def test_admin_can_create_meal(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    payload = sample_meal_payload(meal_type="breakfast")
    payload["dishes"] = ["Idli", "Vada", "Sambar", "Coconut Chutney"]
    payload["portion_sizes"] = {"Idli": "4 pcs", "Vada": "1 pc"}

    res = client.post("/api/meals", json=payload, headers=auth_header(admin))
    assert res.status_code == 201
    body = res.json()
    assert body["meal_type"] == "breakfast"
    assert "Idli" in body["dishes"]
    assert body["portion_sizes"]["Idli"] == "4 pcs"
    assert body["is_open"] is True


def test_student_cannot_create_meal(client, make_user, auth_header):
    student = make_user("student@example.com", Role.student)
    res = client.post("/api/meals", json=sample_meal_payload(), headers=auth_header(student))
    assert res.status_code == 403


def test_duplicate_meal_for_same_date_and_type_rejected(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    payload = sample_meal_payload(meal_type="lunch")
    res1 = client.post("/api/meals", json=payload, headers=auth_header(admin))
    assert res1.status_code == 201

    res2 = client.post("/api/meals", json=payload, headers=auth_header(admin))
    assert res2.status_code == 409
    assert "already scheduled" in res2.json()["detail"]


def test_meal_empty_dishes_rejected_by_validation(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    payload = sample_meal_payload(meal_type="dinner")
    payload["dishes"] = []
    res = client.post("/api/meals", json=payload, headers=auth_header(admin))
    assert res.status_code == 422


def test_get_today_meals_returns_scheduled_meals(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    student = make_user("student@example.com", Role.student)

    # Admin creates today's lunch
    client.post("/api/meals", json=sample_meal_payload(meal_type="lunch"), headers=auth_header(admin))

    res = client.get("/api/meals/today", headers=auth_header(student))
    assert res.status_code == 200
    meals = res.json()
    assert len(meals) >= 1
    assert meals[0]["user_status"] is None  # Student hasn't checked in yet


def test_admin_can_delete_meal(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    res = client.post("/api/meals", json=sample_meal_payload(meal_type="dinner"), headers=auth_header(admin))
    meal_id = res.json()["id"]

    del_res = client.delete(f"/api/meals/{meal_id}", headers=auth_header(admin))
    assert del_res.status_code == 204

    # Verify deleted
    get_res = client.get(f"/api/meals/{meal_id}", headers=auth_header(admin))
    assert get_res.status_code == 404
