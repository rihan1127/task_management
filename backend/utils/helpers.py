"""
Backend Utilities
Common utility functions for the application
"""

from datetime import datetime, timedelta
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Custom API error"""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


def calculate_due_date_status(due_date) -> str:
    """Calculate task due date status"""
    if not due_date:
        return "no_due_date"
    
    now = datetime.utcnow()
    diff_days = (due_date - now).days
    
    if diff_days < 0:
        return "overdue"
    elif diff_days == 0:
        return "today"
    elif diff_days == 1:
        return "tomorrow"
    elif diff_days <= 7:
        return "this_week"
    else:
        return "upcoming"


def get_task_completion_percentage(total: int, completed: int) -> float:
    """Calculate task completion percentage"""
    if total == 0:
        return 0.0
    return round((completed / total) * 100, 2)


def is_overdue(due_date) -> bool:
    """Check if task is overdue"""
    if not due_date:
        return False
    return due_date < datetime.utcnow()


def format_datetime(dt: datetime) -> str:
    """Format datetime to ISO format"""
    if not dt:
        return None
    return dt.isoformat()


def get_weeks_since(date: datetime) -> int:
    """Calculate weeks since a date"""
    if not date:
        return 0
    delta = datetime.utcnow() - date
    return delta.days // 7


def get_days_since(date: datetime) -> int:
    """Calculate days since a date"""
    if not date:
        return 0
    delta = datetime.utcnow() - date
    return delta.days


def paginate_query(query, skip: int, limit: int):
    """Apply pagination to query"""
    return query.offset(skip).limit(limit)


def build_sort_clause(model, sort_by: str, sort_order: str):
    """Build SQLAlchemy sort clause"""
    column = getattr(model, sort_by, None)
    if column is None:
        return None
    
    if sort_order.lower() == "asc":
        return column.asc()
    return column.desc()


def sanitize_string(value: str, max_length: int = None) -> str:
    """Sanitize string input"""
    if not value:
        return value
    
    # Remove leading/trailing whitespace
    value = value.strip()
    
    # Truncate if needed
    if max_length and len(value) > max_length:
        value = value[:max_length]
    
    return value


def validate_enum(value: str, enum_class):
    """Validate if value is valid enum"""
    try:
        return enum_class(value)
    except ValueError:
        valid_values = [e.value for e in enum_class]
        raise APIError(
            f"Invalid value '{value}'. Must be one of: {', '.join(valid_values)}"
        )


def build_response(
    status: str = "success",
    data: Any = None,
    message: str = None,
    **kwargs
) -> Dict:
    """Build standard API response"""
    response = {
        "status": status,
        **({"data": data} if data is not None else {}),
        **({"message": message} if message else {}),
        **kwargs
    }
    return response


def log_activity(user_id: int, action: str, resource: str, details: Dict = None):
    """Log user activity"""
    log_message = f"User {user_id} performed {action} on {resource}"
    if details:
        log_message += f": {details}"
    logger.info(log_message)
