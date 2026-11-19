"""Database setup: SQLAlchemy engine, session factory and the declarative Base shared by all models."""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
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
