"""
Activity Service - Records task audit log entries
"""
from sqlalchemy.orm import Session
from typing import Optional
from database.models import TaskActivity
import logging

logger = logging.getLogger(__name__)


class ActivityService:

    @staticmethod
    def log(
        db: Session,
        task_id: int,
        user_id: int,
        action: str,
        field_name: Optional[str] = None,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
    ):
        """Create an activity log entry."""
        try:
            entry = TaskActivity(
                task_id=task_id,
                user_id=user_id,
                action=action,
                field_name=field_name,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(new_value) if new_value is not None else None,
            )
            db.add(entry)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")
            db.rollback()

    @staticmethod
    def get_task_activity(db: Session, task_id: int, limit: int = 50):
        """Return activity log for a task, newest first."""
        from database.models import User
        entries = (
            db.query(TaskActivity)
            .filter(TaskActivity.task_id == task_id)
            .order_by(TaskActivity.created_at.desc())
            .limit(limit)
            .all()
        )
        result = []
        for e in entries:
            user = db.query(User).filter(User.id == e.user_id).first()
            result.append({
                "id": e.id,
                "action": e.action,
                "field_name": e.field_name,
                "old_value": e.old_value,
                "new_value": e.new_value,
                "created_at": e.created_at,
                "user": {"id": user.id, "name": user.name, "email": user.email} if user else None,
            })
        return result
