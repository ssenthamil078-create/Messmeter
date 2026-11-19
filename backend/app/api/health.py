"""Health route: used by the frontend status card and by deployment health checks."""
from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": settings.app_name, "environment": settings.app_env}
