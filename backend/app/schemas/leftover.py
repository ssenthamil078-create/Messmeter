"""Pydantic schemas for leftover tracking."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class LeftoverCreate(BaseModel):
    meal_id: int
    dish: str = Field(min_length=1, max_length=120)
    qty_cooked: float = Field(ge=0)
    qty_left: float = Field(ge=0)
    unit: str = Field(default="kg", min_length=1, max_length=20)
    notes: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_quantities(self) -> "LeftoverCreate":
        if self.qty_left > self.qty_cooked:
            raise ValueError("qty_left cannot exceed qty_cooked")
        self.dish = self.dish.strip()
        self.unit = self.unit.strip()
        return self


class LeftoverUpdate(BaseModel):
    qty_cooked: float | None = Field(default=None, ge=0)
    qty_left: float | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, min_length=1, max_length=20)
    notes: str | None = Field(default=None, max_length=500)


class LeftoverOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meal_id: int
    dish: str
    qty_cooked: float
    qty_left: float
    unit: str
    recorded_by: int | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
