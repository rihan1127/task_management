"""
Dashboard Routes
REST API endpoints for dashboard statistics and analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from database.connection import get_db
from repositories.task_repository import TaskRepository
from repositories.user_repository import UserRepository
from database.models import Task, TaskStatus

logger = logging.getLogger(__name__)

router = APIRouter()


def get_current_user_id() -> int:
    """Get current user ID (mock for now)"""
    return 1


@router.get("")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Get comprehensive dashboard statistics
    
    Returns:
    - Total tasks
    - Tasks by status
    - Tasks by priority
    - Overdue tasks
    - Tasks assigned to current user
    - User count
    """
    try:
        # Get task statistics
        stats = TaskRepository.get_task_stats(db)
        
        # Get overdue tasks
        overdue = TaskRepository.get_overdue_tasks(db)
        overdue_count = len(overdue)
        
        # Get current user's tasks
        user_tasks = TaskRepository.get_user_tasks(db, current_user_id)
        user_pending = len([t for t in user_tasks if t.status == TaskStatus.PENDING])
        user_in_progress = len([t for t in user_tasks if t.status == TaskStatus.IN_PROGRESS])
        
        # Get user count
        user_count = UserRepository.count(db)
        
        # Priority distribution
        all_tasks = db.query(Task).all()
        priority_dist = {
            "low": len([t for t in all_tasks if t.priority.value == "low"]),
            "medium": len([t for t in all_tasks if t.priority.value == "medium"]),
            "high": len([t for t in all_tasks if t.priority.value == "high"]),
            "urgent": len([t for t in all_tasks if t.priority.value == "urgent"])
        }
        
        # Completion rate
        completion_rate = (
            (stats["completed"] / stats["total"] * 100)
            if stats["total"] > 0
            else 0
        )
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "tasks": {
                "total": stats["total"],
                "pending": stats["pending"],
                "in_progress": stats["in_progress"],
                "completed": stats["completed"],
                "blocked": stats["blocked"],
                "overdue": overdue_count,
                "completion_rate": round(completion_rate, 2)
            },
            "priority_distribution": priority_dist,
            "current_user": {
                "id": current_user_id,
                "assigned_total": len(user_tasks),
                "pending": user_pending,
                "in_progress": user_in_progress,
                "overdue_assigned": len(
                    [t for t in overdue if t.assigned_to == current_user_id]
                )
            },
            "team": {
                "total_users": user_count,
                "active_contributors": db.query(
                    Task.created_by
                ).distinct().count()
            },
            "trends": {
                "tasks_created_today": len([
                    t for t in all_tasks
                    if (datetime.utcnow() - t.created_at).days == 0
                ]),
                "tasks_completed_today": len([
                    t for t in all_tasks
                    if t.status == TaskStatus.COMPLETED and
                    (datetime.utcnow() - t.updated_at).days == 0
                ])
            }
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching dashboard data"
        )


@router.get("/tasks/overdue")
async def get_overdue_tasks(
    db: Session = Depends(get_db)
):
    """Get all overdue tasks"""
    try:
        overdue_tasks = TaskRepository.get_overdue_tasks(db)
        
        return {
            "status": "success",
            "total": len(overdue_tasks),
            "tasks": [
                {
                    "id": task.id,
                    "title": task.title,
                    "priority": task.priority.value,
                    "assigned_user": {
                        "id": task.assigned_user.id,
                        "name": task.assigned_user.name,
                        "email": task.assigned_user.email
                    } if task.assigned_user else None,
                    "due_date": task.due_date,
                    "days_overdue": (
                        (datetime.utcnow() - task.due_date).days
                        if task.due_date else None
                    )
                }
                for task in sorted(overdue_tasks, key=lambda t: t.due_date or datetime.utcnow())
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching overdue tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching overdue tasks"
        )


@router.get("/tasks/upcoming")
async def get_upcoming_tasks(
    db: Session = Depends(get_db),
    days: int = Query(7, ge=1, le=90)
):
    """Get tasks due in the next N days"""
    try:
        now = datetime.utcnow()
        future_date = now + timedelta(days=days)
        
        upcoming = db.query(Task).filter(
            Task.due_date.between(now, future_date),
            Task.status != TaskStatus.COMPLETED
        ).order_by(Task.due_date).all()
        
        return {
            "status": "success",
            "days_range": days,
            "total": len(upcoming),
            "tasks": [
                {
                    "id": task.id,
                    "title": task.title,
                    "priority": task.priority.value,
                    "status": task.status.value,
                    "assigned_user": {
                        "id": task.assigned_user.id,
                        "name": task.assigned_user.name
                    } if task.assigned_user else None,
                    "due_date": task.due_date,
                    "days_until_due": (
                        (task.due_date - now).days
                        if task.due_date else None
                    )
                }
                for task in upcoming
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching upcoming tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching upcoming tasks"
        )
