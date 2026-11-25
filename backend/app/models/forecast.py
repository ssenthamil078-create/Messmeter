"""Forecast table: predicted headcount, low-high confidence intervals, and portion targets."""
from datetime import datetime, timezone
import json

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Forecast(Base):
    __tablename__ = "forecasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meal_id: Mapped[int] = mapped_column(ForeignKey("meals.id", ondelete="CASCADE"), index=True)
    predicted: Mapped[int] = mapped_column(Integer)
    low: Mapped[int] = mapped_column(Integer)
    high: Mapped[int] = mapped_column(Integer)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.85)
    actual_headcount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), default="baseline-v1")
    portion_plan: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    @property
    def portions(self) -> dict:
        try:
            return json.loads(self.portion_plan)
        except (ValueError, TypeError):
            return {}
