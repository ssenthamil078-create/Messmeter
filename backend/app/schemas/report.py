"""Pydantic schemas for admin weekly analytics and inventory stock reports."""
from datetime import date as dt_date, datetime

from pydantic import BaseModel, ConfigDict, Field


class WeeklyMealStat(BaseModel):
    meal_id: int
    date: dt_date
    meal_type: str
    eating_count: int
    skipping_count: int
    predicted_headcount: int | None = None
    confidence_score: float | None = None
    qty_cooked: float = 0.0
    qty_left: float = 0.0


class WeeklyReportOut(BaseModel):
    days: int
    total_meals: int
    total_eating: int
    total_skipping: int
    turnout_rate_pct: float
    avg_forecast_confidence: float | None
    total_cooked: float
    total_leftover: float
    waste_pct: float
    meals: list[WeeklyMealStat]


class InventoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = Field(default="General", min_length=1, max_length=60)
    quantity: float = Field(ge=0)
    unit: str = Field(default="kg", min_length=1, max_length=20)
    reorder_level: float = Field(default=10.0, ge=0)


class InventoryUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=60)
    quantity: float | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, min_length=1, max_length=20)
    reorder_level: float | None = Field(default=None, ge=0)


class InventoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    quantity: float
    unit: str
    reorder_level: float
    is_low_stock: bool
    updated_at: datetime


class InventoryReportOut(BaseModel):
    total_items: int
    low_stock_count: int
    categories: dict[str, int]
    items: list[InventoryOut]
