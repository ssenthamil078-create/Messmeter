"""Pydantic schemas for meal check-in attendance."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.checkin import AttendanceStatus


class CheckinCreate(BaseModel):
    meal_id: int
    status: AttendanceStatus


class CheckinOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    meal_id: int
    status: AttendanceStatus
    created_at: datetime
    updated_at: datetime
