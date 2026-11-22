"""Checkin table: user attendance intent (eating / skipping) per meal."""
from datetime import datetime, timezone
import enum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AttendanceStatus(str, enum.Enum):
    eating = "eating"
    skipping = "skipping"


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Checkin(Base):
    __tablename__ = "checkins"
    __table_args__ = (
        UniqueConstraint("user_id", "meal_id", name="uq_user_meal_checkin"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    meal_id: Mapped[int] = mapped_column(ForeignKey("meals.id", ondelete="CASCADE"), index=True)
    status: Mapped[AttendanceStatus] = mapped_column(Enum(AttendanceStatus, native_enum=False, length=20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)
