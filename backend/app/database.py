"""Database setup: SQLAlchemy engine, session factory and the declarative Base shared by all models."""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

import os

db_url = settings.database_url
# Default to SQLite for seamless local development and automated testing
if (not os.getenv("DATABASE_URL") and db_url.startswith("postgresql")) or "sqlite" in db_url:
    db_url = "sqlite:///./messmeter.db"

connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
engine = create_engine(db_url, connect_args=connect_args)
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
