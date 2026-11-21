import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models.user import Role, User
from app.security import create_access_token, hash_password

TEST_PASSWORD = "correct-horse-1"


@pytest.fixture(autouse=True)
def fast_bcrypt(monkeypatch):
    """Use the cheapest bcrypt setting so tests stay fast."""
    monkeypatch.setattr(settings, "bcrypt_rounds", 4)
    monkeypatch.setattr(settings, "secret_key", "test-secret-key-that-is-at-least-32-bytes-long")


@pytest.fixture()
def db_session():
    """A fresh in-memory SQLite database for every test."""
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, autoflush=False)()
    yield session
    session.close()
    engine.dispose()


@pytest.fixture()
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def make_user(db_session):
    def _make(email="student@example.com", role=Role.student, name="Test User", active=True, password=TEST_PASSWORD):
        user = User(name=name, email=email, password_hash=hash_password(password), role=role, is_active=active)
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return _make


@pytest.fixture()
def auth_header():
    def _header(user: User) -> dict:
        return {"Authorization": f"Bearer {create_access_token(user.id, user.role.value)}"}

    return _header
