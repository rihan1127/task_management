"""
Activity Routes - Task audit log endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from services.activity_service import ActivityService
from utils.auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/tasks/{task_id}")
async def get_task_activity(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get activity log for a specific task."""
    return ActivityService.get_task_activity(db, task_id)
