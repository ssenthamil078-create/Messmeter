"""Portion planner: converts predicted headcount and range into bulk kitchen quantities per dish."""
import re
from typing import Any

from app.schemas.forecast import PortionTarget


def parse_portion_string(s: str) -> tuple[float, str]:
    """Parse portion strings like '0.25 kg', '3 pcs', '0.15 L' into (qty, unit)."""
    match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)?", s.strip())
    if match:
        qty = float(match.group(1))
        unit = match.group(2) or "units"
        return qty, unit
    return 1.0, "portion"


def calculate_portion_plan(
    portions_map: dict[str, str],
    dishes: list[str],
    predicted: int,
    low: int,
    high: int,
) -> list[PortionTarget]:
    """Calculate batch preparation targets for all dishes based on headcount."""
    targets: list[PortionTarget] = []

    for dish in dishes:
        raw_portion = portions_map.get(dish, "1 portion")
        qty, unit = parse_portion_string(raw_portion)

        rec_val = round(qty * predicted, 2)
        min_val = round(qty * low, 2)
        max_val = round(qty * high, 2)

        # Format integer quantities nicely if no decimal part
        def fmt(val: float, u: str) -> str:
            if val.is_integer():
                return f"{int(val)} {u}"
            return f"{val:.2f} {u}"

        targets.append(
            PortionTarget(
                dish=dish,
                per_person=raw_portion,
                recommended_total=fmt(rec_val, unit),
                min_total=fmt(min_val, unit),
                max_total=fmt(max_val, unit),
            )
        )

    return targets
