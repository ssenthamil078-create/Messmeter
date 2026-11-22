"""Tests for Student Check-in (Tasks CHK-1 to CHK-5)."""
from datetime import datetime, timedelta, timezone

from app.models.checkin import AttendanceStatus
from app.models.meal import Meal, MealType
from app.models.user import Role


def create_test_meal(db_session, hours_offset: int = 2):
    cutoff = datetime.now(timezone.utc) + timedelta(hours=hours_offset)
    meal = Meal(
        date=cutoff.date(),
        meal_type=MealType.lunch,
        menu_items='["Rice", "Sambar", "Curd"]',
        portion_sizes='{"Rice": "0.25 kg"}',
        cutoff_time=cutoff,
    )
    db_session.add(meal)
    db_session.commit()
    db_session.refresh(meal)
    return meal


def test_student_can_checkin_eating(client, make_user, auth_header, db_session):
    student = make_user("student1@example.com", Role.student)
    meal = create_test_meal(db_session, hours_offset=3)

    payload = {"meal_id": meal.id, "status": "eating"}
    res = client.post("/api/checkins", json=payload, headers=auth_header(student))
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "eating"
    assert body["user_id"] == student.id
    assert body["meal_id"] == meal.id


def test_student_can_change_checkin_choice_before_cutoff(client, make_user, auth_header, db_session):
    student = make_user("student2@example.com", Role.student)
    meal = create_test_meal(db_session, hours_offset=3)

    # First mark Eating
    res1 = client.post("/api/checkins", json={"meal_id": meal.id, "status": "eating"}, headers=auth_header(student))
    assert res1.status_code == 200
    assert res1.json()["status"] == "eating"

    # Change to Skipping
    res2 = client.post("/api/checkins", json={"meal_id": meal.id, "status": "skipping"}, headers=auth_header(student))
    assert res2.status_code == 200
    assert res2.json()["status"] == "skipping"


def test_checkin_rejected_after_cutoff_time(client, make_user, auth_header, db_session):
    student = make_user("student3@example.com", Role.student)
    # Meal cutoff was 1 hour ago
    past_meal = create_test_meal(db_session, hours_offset=-1)

    res = client.post("/api/checkins", json={"meal_id": past_meal.id, "status": "eating"}, headers=auth_header(student))
    assert res.status_code == 400
    assert "closed" in res.json()["detail"].lower()


def test_staff_cannot_mark_student_checkin(client, make_user, auth_header, db_session):
    staff = make_user("staff1@example.com", Role.staff)
    meal = create_test_meal(db_session, hours_offset=2)

    res = client.post("/api/checkins", json={"meal_id": meal.id, "status": "eating"}, headers=auth_header(staff))
    assert res.status_code == 403


def test_checkin_summary_calculates_counts(client, make_user, auth_header, db_session):
    admin = make_user("admin@example.com", Role.admin)
    s1 = make_user("student_a@example.com", Role.student)
    s2 = make_user("student_b@example.com", Role.student)
    s3 = make_user("student_c@example.com", Role.student)
    meal = create_test_meal(db_session, hours_offset=2)

    # s1 eats, s2 skips, s3 does not respond
    client.post("/api/checkins", json={"meal_id": meal.id, "status": "eating"}, headers=auth_header(s1))
    client.post("/api/checkins", json={"meal_id": meal.id, "status": "skipping"}, headers=auth_header(s2))

    summary_res = client.get(f"/api/checkins/summary/{meal.id}", headers=auth_header(admin))
    assert summary_res.status_code == 200
    data = summary_res.json()
    assert data["eating"] == 1
    assert data["skipping"] == 1
    assert data["total_responded"] == 2
    assert data["not_responded"] >= 1
