"""Pydantic schemas for meals and menus."""
from datetime import date as dt_date, datetime
import json
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.meal import MealType


class MealCreate(BaseModel):
    date: dt_date
    meal_type: MealType
    dishes: list[str] = Field(min_length=1)
    portion_sizes: dict[str, str] = Field(default_factory=dict)
    cutoff_time: datetime

    @field_validator("dishes")
    @classmethod
    def validate_dishes(cls, v: list[str]) -> list[str]:
        cleaned = [d.strip() for d in v if d.strip()]
        if not cleaned:
            raise ValueError("Meal must contain at least one valid dish name")
        return cleaned


class MealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: dt_date
    meal_type: MealType
    dishes: list[str]
    portion_sizes: dict[str, str]
    cutoff_time: datetime
    is_open: bool
    created_at: datetime

    @classmethod
    def from_model(cls, meal: Any, is_open_override: bool | None = None) -> "MealOut":
        portions = meal.portions if hasattr(meal, "portions") else {}
        dishes = meal.dishes if hasattr(meal, "dishes") else []
        return cls(
            id=meal.id,
            date=meal.date,
            meal_type=meal.meal_type,
            dishes=dishes,
            portion_sizes=portions,
            cutoff_time=meal.cutoff_time,
            is_open=meal.is_open if is_open_override is None else is_open_override,
            created_at=meal.created_at,
        )


class MealWithCheckin(MealOut):
    user_status: str | None = None  # "eating", "skipping", or None
