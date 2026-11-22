"""Create demo accounts and sample scheduled meals so the app can be tried straight away.

Usage (from the repo root, with the backend venv active):
    python scripts/seed_users.py

Passwords are random and printed once, unless SEED_PASSWORD is set.
Existing users and meals are left untouched, so the script is safe to re-run.
"""
from datetime import datetime, timedelta, timezone
import json
import os
import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app import models  # noqa: E402,F401
from app.models.meal import Meal, MealType  # noqa: E402
from app.models.user import Role, User  # noqa: E402
from app.security import hash_password  # noqa: E402

DEMO_USERS = [
    ("Mess Admin", "admin@example.com", Role.admin),
    ("Kitchen Staff", "staff@example.com", Role.staff),
    ("Demo Student", "student@example.com", Role.student),
    ("Asha Sharma", "asha@example.com", Role.student),
    ("Rahul Verma", "rahul@example.com", Role.student),
]


def seed_meals(db) -> None:
    now = datetime.now(timezone.utc)
    today = now.date()

    sample_meals = [
        (
            today,
            MealType.breakfast,
            ["Idli (4 pcs)", "Medu Vada (1 pc)", "Sambar", "Coconut Chutney", "Filter Coffee"],
            {"Idli": "4 pcs", "Medu Vada": "1 pc", "Sambar": "0.15 L", "Coffee": "0.10 L"},
            now.replace(hour=8, minute=0, second=0, microsecond=0) if now.hour >= 8 else now + timedelta(hours=1),
        ),
        (
            today,
            MealType.lunch,
            ["Steamed Basmati Rice", "South Indian Sambar", "Vegetable Kurma", "Curd / Buttermilk", "Appalam"],
            {"Steamed Basmati Rice": "0.25 kg", "Sambar": "0.15 L", "Vegetable Kurma": "0.12 kg", "Curd": "0.10 L"},
            now + timedelta(hours=3),
        ),
        (
            today,
            MealType.dinner,
            ["Chapati (3 pcs)", "Paneer Butter Masala", "Jeera Rice", "Yellow Dal Tadka", "Gulab Jamun"],
            {"Chapati": "3 pcs", "Paneer Butter Masala": "0.15 kg", "Jeera Rice": "0.15 kg", "Yellow Dal Tadka": "0.12 L"},
            now + timedelta(hours=8),
        ),
    ]

    for date_val, m_type, dishes, portions, cutoff in sample_meals:
        existing = db.query(Meal).filter(Meal.date == date_val, Meal.meal_type == m_type).first()
        if existing:
            print(f"skip   meal {m_type.value} on {date_val} (already exists)")
            continue

        meal = Meal(
            date=date_val,
            meal_type=m_type,
            menu_items=json.dumps(dishes),
            portion_sizes=json.dumps(portions),
            cutoff_time=cutoff,
        )
        db.add(meal)
        db.commit()
        print(f"create meal {m_type.value:<10} date={date_val} cutoff={cutoff.strftime('%H:%M UTC')}")


def main() -> None:
    Base.metadata.create_all(bind=engine)
    shared = os.environ.get("SEED_PASSWORD", "demo12345")
    with SessionLocal() as db:
        for name, email, role in DEMO_USERS:
            if db.query(User).filter(User.email == email).first():
                print(f"skip   {email} (already exists)")
                continue
            password = shared or secrets.token_urlsafe(9)
            db.add(User(name=name, email=email, password_hash=hash_password(password), role=role))
            db.commit()
            print(f"create {email:<26} role={role.value:<8} password={password}")

        seed_meals(db)


if __name__ == "__main__":
    main()
