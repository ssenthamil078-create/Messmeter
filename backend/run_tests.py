"""Standalone direct test runner for backend tests.
Runs all tests against in-memory SQLite and reports results.
"""
import sys
from datetime import datetime, timedelta, timezone

# Add backend to path
sys.path.insert(0, ".")

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import auth, checkins, meals, users
from app.config import settings
settings.secret_key = "test-secret-key-that-is-at-least-32-bytes-long"
from app.api.deps import require_roles
from app.database import Base
from app.models.checkin import AttendanceStatus, Checkin
from app.models.meal import Meal, MealType
from app.models.user import Role, User
from app.schemas.checkin import CheckinCreate
from app.schemas.meal import MealCreate
from app.schemas.user import LoginRequest, UserCreate, UserUpdate
from app.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def run_all_tests():
    passed = 0
    failed = 0

    def assert_true(expr, msg="Assertion failed"):
        nonlocal passed, failed
        if expr:
            passed += 1
        else:
            failed += 1
            print(f"  [FAIL] {msg}")

    print("==================================================")
    print("MESSMETER BACKEND TEST SUITE - PHASE 1 DAY 6")
    print("==================================================")

    # 1. Security Tests
    print("\n--- Running Security Tests ---")
    h1 = hash_password("testpass123")
    assert_true(verify_password("testpass123", h1), "bcrypt verify valid password")
    assert_true(not verify_password("wrongpass", h1), "bcrypt reject wrong password")
    assert_true(hash_password("testpass123") != h1, "bcrypt generates unique salts")

    tok = create_access_token(10, "student")
    payload = decode_access_token(tok)
    assert_true(payload["sub"] == "10" and payload["role"] == "student", "JWT roundtrip")

    # In-memory DB setup for endpoint tests
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False)
    db = Session()

    # 2. User & Auth Tests (Day 5 review & improvements)
    print("\n--- Running Auth & User Management Tests (Day 5 Review & Improvements) ---")
    admin = User(name="Admin", email="admin@example.com", password_hash=hash_password("admin12345"), role=Role.admin)
    student = User(name="Student", email="student@example.com", password_hash=hash_password("student12345"), role=Role.student)
    db.add_all([admin, student])
    db.commit()

    # Test login
    login_res = auth.login(LoginRequest(email="admin@example.com", password="admin12345"), db=db)
    assert_true(login_res.access_token is not None, "Admin login success")
    assert_true(login_res.user.email == "admin@example.com", "Admin user returned")

    # Test wrong password
    try:
        auth.login(LoginRequest(email="admin@example.com", password="wrongpassword"), db=db)
        assert_true(False, "Wrong password should raise 401")
    except HTTPException as e:
        assert_true(e.status_code == 401, "Wrong password returns 401")

    # Test create user
    new_user = users.create_user(
        UserCreate(name="Kavitha", email="kavitha@example.com", password="kavithapassword", role=Role.student),
        db=db,
        _=admin,
    )
    assert_true(new_user.id is not None and new_user.email == "kavitha@example.com", "Admin creates user")

    # Test duplicate email rejected
    try:
        users.create_user(
            UserCreate(name="Kavitha 2", email="kavitha@example.com", password="kavithapassword", role=Role.student),
            db=db,
            _=admin,
        )
        assert_true(False, "Duplicate email should raise 409")
    except HTTPException as e:
        assert_true(e.status_code == 409, "Duplicate user email raises 409 Conflict")

    # Test admin deactivate user
    updated = users.set_user_active(new_user.id, UserUpdate(is_active=False), db=db, admin=admin)
    assert_true(updated.is_active is False, "Admin deactivates student")

    # Test admin cannot deactivate self
    try:
        users.set_user_active(admin.id, UserUpdate(is_active=False), db=db, admin=admin)
        assert_true(False, "Admin cannot deactivate self")
    except HTTPException as e:
        assert_true(e.status_code == 400, "Admin deactivating self returns 400 Bad Request")

    # 3. Meals & Menu Tests (Day 6 Feature 2)
    print("\n--- Running Meals & Menus Tests (Day 6 New Feature) ---")
    today = datetime.now(timezone.utc).date()
    future_cutoff = datetime.now(timezone.utc) + timedelta(hours=3)
    meal_data = MealCreate(
        date=today,
        meal_type=MealType.lunch,
        dishes=["Paneer Biryani", "Mirchi Ka Salan", "Raita", "Gulab Jamun"],
        portion_sizes={"Paneer Biryani": "0.35 kg", "Raita": "0.10 L"},
        cutoff_time=future_cutoff,
    )
    created_meal = meals.create_meal(meal_data, db=db, _=admin)
    assert_true(created_meal.id is not None, "Admin creates meal")
    assert_true(len(created_meal.dishes) == 4, "Dishes stored and parsed correctly")
    assert_true(created_meal.is_open is True, "Future meal is_open returns True")

    # Test duplicate meal on same date & type
    try:
        meals.create_meal(meal_data, db=db, _=admin)
        assert_true(False, "Duplicate meal should raise 409")
    except HTTPException as e:
        assert_true(e.status_code == 409, "Duplicate meal for same date and meal_type returns 409")

    # Test list meals
    all_meals = meals.list_meals(db=db, _=admin)
    assert_true(len(all_meals) >= 1, "List meals returns created meals")

    # Test GET /today with user context
    today_meals = meals.get_today_meals(db=db, current_user=student)
    assert_true(len(today_meals) >= 1, "GET /api/meals/today returns today's meals")
    assert_true(today_meals[0].user_status is None, "Student has not checked in yet (user_status=None)")

    # 4. Check-in Feature & Integration Tests (Day 6 Feature 2 & Integration)
    print("\n--- Running Check-in & Integration Tests ---")
    # Student marks eating
    chk = checkins.submit_checkin(
        CheckinCreate(meal_id=created_meal.id, status=AttendanceStatus.eating),
        db=db,
        user=student,
    )
    assert_true(chk.status == AttendanceStatus.eating, "Student marks Eating")

    # Verify user_status is now "eating" in GET /meals/today
    refreshed_today = meals.get_today_meals(db=db, current_user=student)
    assert_true(refreshed_today[0].user_status == "eating", "Meals today reflects student's Eating status")

    # Student updates choice to skipping
    chk2 = checkins.submit_checkin(
        CheckinCreate(meal_id=created_meal.id, status=AttendanceStatus.skipping),
        db=db,
        user=student,
    )
    assert_true(chk2.status == AttendanceStatus.skipping, "Student changes choice to Skipping before cutoff")

    # Test closed meal cutoff enforcement
    past_cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    past_meal = meals.create_meal(
        MealCreate(
            date=today - timedelta(days=1),
            meal_type=MealType.dinner,
            dishes=["Curd Rice", "Pickle"],
            cutoff_time=past_cutoff,
        ),
        db=db,
        _=admin,
    )
    try:
        checkins.submit_checkin(
            CheckinCreate(meal_id=past_meal.id, status=AttendanceStatus.eating),
            db=db,
            user=student,
        )
        assert_true(False, "Checkin on closed meal should raise 400")
    except HTTPException as e:
        assert_true(e.status_code == 400, "Checkin on past cutoff returns 400 Bad Request")

    # Test summary endpoint
    summary = checkins.get_meal_attendance_summary(created_meal.id, db=db, _=admin)
    assert_true(summary["skipping"] == 1, "Summary reports 1 skipping")
    assert_true(summary["eating"] == 0, "Summary reports 0 eating")
    assert_true(summary["total_responded"] == 1, "Summary reports 1 total responded")

    print("\n==================================================")
    print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
    print("==================================================")
    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    run_all_tests()
