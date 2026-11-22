"""Meal table: id, date, meal_type, menu_items, portion_sizes, cutoff_time, created_at."""
from datetime import date as dt_date, datetime, timezone
import enum
import json

from sqlalchemy import Date, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MealType(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Meal(Base):
    __tablename__ = "meals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[dt_date] = mapped_column(Date, index=True)
    meal_type: Mapped[MealType] = mapped_column(Enum(MealType, native_enum=False, length=20))
    # Stored as JSON string or comma-separated string for multi-dialect compatibility
    menu_items: Mapped[str] = mapped_column(Text, default="[]")
    portion_sizes: Mapped[str] = mapped_column(Text, default="{}")
    cutoff_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    @property
    def dishes(self) -> list[str]:
        try:
            return json.loads(self.menu_items)
        except (ValueError, TypeError):
            return [d.strip() for d in self.menu_items.split(",") if d.strip()]

    @property
    def portions(self) -> dict[str, str]:
        try:
            return json.loads(self.portion_sizes)
        except (ValueError, TypeError):
            return {}

    @property
    def is_open(self) -> bool:
        """Returns True if current time is before the meal cutoff time."""
        now = datetime.now(timezone.utc)
        # Ensure cutoff_time is timezone-aware for comparison
        cutoff = self.cutoff_time
        if cutoff.tzinfo is None:
            cutoff = cutoff.replace(tzinfo=timezone.utc)
        return now < cutoff
