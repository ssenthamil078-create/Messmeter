"""Health route: verifies API liveness and database connectivity."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict:
    db_status = "connected"
    dialect = db.bind.dialect.name if db.bind is not None else "unknown"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "service": settings.app_name,
        "environment": settings.app_env,
        "database": db_status,
        "dialect": dialect,
    }
