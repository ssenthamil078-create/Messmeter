"""Database setup: SQLAlchemy engine, session factory and declarative Base."""
from collections.abc import Generator
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

db_url = os.getenv("DATABASE_URL") or settings.database_url
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql+psycopg2://"):
    try:
        import psycopg2  # noqa: F401
    except ImportError:
        try:
            import psycopg  # noqa: F401
            db_url = db_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
        except ImportError:
            pass
elif db_url.startswith("postgresql+psycopg://"):
    try:
        import psycopg  # noqa: F401
    except ImportError:
        db_url = db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
try:
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
except Exception:
    engine = create_engine("sqlite:///./messmeter.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Parent class of every SQLAlchemy model."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that gives each request its own database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
