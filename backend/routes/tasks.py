"""
Task Routes
REST API endpoints for task management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging

from database.connection import get_db
from schemas.task_schema import (
    TaskCreate, TaskUpdate, TaskResponse, 
    TaskListResponse, PaginatedResponse
)
from services.task_service import TaskService
from repositories.task_repository import TaskRepository
from utils.auth import get_current_user, get_current_user_id, require_roles
from database.models import User

logger = logging.getLogger(__name__)

router = APIRouter()


# ========================
# TASK ENDPOINTS
# ========================

@router.get("", response_model=PaginatedResponse)
async def list_tasks(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assignee: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("updated_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$")
):
    """
    List all tasks with advanced filtering and pagination
    
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 20, max: 100)
    - **status**: Filter by status (pending, in_progress, completed, blocked)
    - **priority**: Filter by priority (low, medium, high, urgent)
    - **assignee**: Filter by assigned user ID
    - **search**: Search in title and description
    - **sort_by**: Sort field (default: updated_at)
    - **sort_order**: Sort order (asc or desc)
    """
    try:
        result = TaskService.list_tasks(
            db=db,
            page=page,
            page_size=page_size,
            status=status,
            priority=priority,
            assignee=assignee,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        pagination = result["pagination"]
        return {
            "items": result["items"],
            "total": pagination["total"],
            "page": pagination["page"],
            "page_size": pagination["page_size"],
            "total_pages": pagination["total_pages"],
            "has_next": pagination["has_next"],
            "has_previous": pagination["has_previous"]
        }
    except Exception as e:
        logger.error(f"Error listing tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error fetching tasks"
        )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager", "developer", "analyst"))
):
    """
    Create a new task
    
    - **title**: Task title (required)
    - **description**: Task description (optional)
    - **assigned_to**: User ID to assign to (optional)
    - **priority**: Task priority (low, medium, high, urgent)
    - **due_date**: Due date (optional)
    """
    try:
        result = TaskService.create_task(
            db=db,
            task_data=task_data,
            created_by=current_user.id,
            current_user_id=current_user.id
        )
        return {
            **result,
            "status": "success"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating task"
        )


@router.get("/{task_id}")
async def get_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed task information"""
    try:
        task_detail = TaskService.get_task_details(db, task_id)
        if not task_detail:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )
        return task_detail
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching task"
        )


@router.put("/{task_id}")
async def update_task(
    task_id: int,
    update_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a task.
    Allows authenticated users to update task attributes, status transitions, and assignments.
    """
    try:
        task = TaskRepository.get_by_id(db, task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )

        result = TaskService.update_task(db, task_id, update_data)
        return {
            "status": "success",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating task"
        )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager"))
):
    """Delete a task (admin and manager only)"""
    try:
        if not TaskRepository.get_by_id(db, task_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )
        
        TaskService.delete_task(db, task_id)
        logger.info(f"Task {task_id} deleted")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting task"
        )


@router.get("/{user_id}/assigned")
async def get_user_tasks(
    user_id: int,
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None)
):
    """Get tasks assigned to a specific user"""
    try:
        tasks = TaskService.get_user_assigned_tasks(db, user_id, status)
        return {
            "user_id": user_id,
            "tasks": tasks,
            "total": len(tasks)
        }
    except Exception as e:
        logger.error(f"Error fetching user tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching tasks"
        )
