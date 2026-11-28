# Import every model here so that Base.metadata knows about all tables.
from app.models.user import Role, User  # noqa: F401
from app.models.meal import Meal, MealType  # noqa: F401
from app.models.checkin import AttendanceStatus, Checkin  # noqa: F401
from app.models.forecast import Forecast  # noqa: F401
from app.models.leftover import Leftover  # noqa: F401
from app.models.inventory import InventoryItem  # noqa: F401
