"""Create one demo account per role so the app can be tried straight away.

Usage (from the repo root, with the backend venv active):
    python scripts/seed_users.py

Passwords are random and printed once, unless SEED_PASSWORD is set.
Existing users are left untouched, so the script is safe to re-run.
"""
import os
import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app import models  # noqa: E402,F401
from app.models.user import Role, User  # noqa: E402
from app.security import hash_password  # noqa: E402

DEMO_USERS = [
    ("Mess Admin", "admin@messmeter.local", Role.admin),
    ("Kitchen Staff", "staff@messmeter.local", Role.staff),
    ("Demo Student", "student@messmeter.local", Role.student),
]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    shared = os.environ.get("SEED_PASSWORD")
    with SessionLocal() as db:
        for name, email, role in DEMO_USERS:
            if db.query(User).filter(User.email == email).first():
                print(f"skip   {email} (already exists)")
                continue
            password = shared or secrets.token_urlsafe(9)
            db.add(User(name=name, email=email, password_hash=hash_password(password), role=role))
            db.commit()
            print(f"create {email:<26} role={role.value:<8} password={password}")


if __name__ == "__main__":
    main()
