"""Pydantic schemas for headcount forecast and portion plan."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class PortionTarget(BaseModel):
    dish: str
    per_person: str
    recommended_total: str
    min_total: str
    max_total: str


class ForecastOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    meal_id: int
    predicted: int
    low: int
    high: int
    confidence_score: float
    confirmed_eating: int
    confirmed_skipping: int
    non_responders: int
    estimated_non_responder_eaters: int
    portion_targets: list[PortionTarget] = []
    model_version: str = "baseline-v1"
    created_at: datetime | None = None
