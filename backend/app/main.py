import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app import models  # noqa: F401  (registers all tables on Base.metadata)
from app.api import auth, checkins, forecast, health, meals, users
from app.config import settings
from app.database import Base, engine

logger = logging.getLogger("messmeter")


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.check_secret_key()
    try:
        # Simple table creation for now; Alembic migrations replace this later (task DB-2).
        Base.metadata.create_all(bind=engine)
    except OperationalError:
        logger.warning("Database is not reachable; starting without it. Start PostgreSQL (docker compose up -d db).")
    yield


app = FastAPI(title=settings.app_name, version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Every router is registered here; more are added as each module is built.
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(meals.router, prefix="/api")
app.include_router(checkins.router, prefix="/api")
app.include_router(forecast.router, prefix="/api")
