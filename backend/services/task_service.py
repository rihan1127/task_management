"""
Task Service
Business logic for task operations
"""

from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from repositories.task_repository import TaskRepository
from repositories.user_repository import UserRepository
from schemas.task_schema import TaskCreate, TaskUpdate
from database.models import TaskStatus, TaskPriority
from services.activity_service import ActivityService

logger = logging.getLogger(__name__)

# Import WS manager lazily to avoid circular import at module load
def _broadcast(event: dict):
    """Fire-and-forget broadcast to WebSocket clients."""
    import asyncio
    try:
        from routes.ws import manager
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(manager.broadcast(event))
        else:
            loop.run_until_complete(manager.broadcast(event))
    except Exception:
        pass  # WS failures must never break API responses


class TaskService:
    """Service for task operations"""
    
    @staticmethod
    def create_task(
        db: Session,
        task_data: TaskCreate,
        created_by: int,
        current_user_id: int
    ) -> Dict[str, Any]:
        """Create a new task"""
        
        # Validate assigned user exists if provided
        if task_data.assigned_to:
            user = UserRepository.get_by_id(db, task_data.assigned_to)
            if not user:
                raise ValueError(f"User {task_data.assigned_to} not found")
        
        # Create task
        task = TaskRepository.create(
            db=db,
            title=task_data.title,
            description=task_data.description,
            issue_type=task_data.issue_type.value if hasattr(task_data.issue_type, 'value') else (task_data.issue_type or "story"),
            story_points=task_data.story_points,
            epic_name=task_data.epic_name,
            sprint=task_data.sprint or "Sprint 1",
            priority=task_data.priority.value,
            assigned_to=task_data.assigned_to,
            created_by=created_by,
            due_date=task_data.due_date
        )

        # Audit log
        ActivityService.log(db, task.id, created_by, "created", new_value=task.title)

        # Broadcast live update
        _broadcast({"event": "task_created", "task_id": task.id, "title": task.title})
        
        return {
            "id": task.id,
            "title": task.title,
            "issue_type": task.issue_type.value if task.issue_type else "story",
            "story_points": task.story_points,
            "epic_name": task.epic_name,
            "sprint": task.sprint,
            "status": task.status.value,
            "priority": task.priority.value,
            "message": "Task created successfully"
        }
    
    @staticmethod
    def get_task_details(db: Session, task_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed task information"""
        task = TaskRepository.get_by_id(db, task_id)
        if not task:
            return None
        
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "issue_type": task.issue_type.value if task.issue_type else "story",
            "story_points": task.story_points,
            "epic_name": task.epic_name,
            "sprint": task.sprint or "Sprint 1",
            "status": task.status.value,
            "priority": task.priority.value,
            "assigned_user": {
                "id": task.assigned_user.id,
                "name": task.assigned_user.name,
                "email": task.assigned_user.email,
                "role": task.assigned_user.role
            } if task.assigned_user else None,
            "creator": {
                "id": task.creator.id,
                "name": task.creator.name,
                "email": task.creator.email,
                "role": task.creator.role
            },
            "due_date": task.due_date,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "comments": [
                {
                    "id": c.id,
                    "comment": c.comment,
                    "author": {
                        "id": c.author.id,
                        "name": c.author.name,
                        "email": c.author.email
                    },
                    "created_at": c.created_at,
                    "updated_at": c.updated_at
                }
                for c in task.comments
            ]
        }
    
    @staticmethod
    def update_task(
        db: Session,
        task_id: int,
        update_data: TaskUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update task"""
        
        # Prepare updates
        updates = {}
        if update_data.title is not None:
            updates["title"] = update_data.title
        if update_data.description is not None:
            updates["description"] = update_data.description
        if update_data.issue_type is not None:
            updates["issue_type"] = update_data.issue_type
        if update_data.story_points is not None:
            updates["story_points"] = update_data.story_points
        if update_data.epic_name is not None:
            updates["epic_name"] = update_data.epic_name
        if update_data.sprint is not None:
            updates["sprint"] = update_data.sprint
        if update_data.status is not None:
            updates["status"] = update_data.status
        if update_data.priority is not None:
            updates["priority"] = update_data.priority
        if update_data.due_date is not None:
            updates["due_date"] = update_data.due_date
        if update_data.assigned_to is not None:
            # Validate user exists
            user = UserRepository.get_by_id(db, update_data.assigned_to)
            if not user:
                raise ValueError(f"User {update_data.assigned_to} not found")
            updates["assigned_to"] = update_data.assigned_to
        
        if not updates:
            return TaskService.get_task_details(db, task_id)
        
        # Capture old values for audit
        old_task = TaskRepository.get_by_id(db, task_id)
        old_status = old_task.status.value if old_task else None

        task = TaskRepository.update(db, task_id, updates)
        if not task:
            return None

        # Log changed fields
        for field, new_val in updates.items():
            old_val = getattr(old_task, field, None)
            if old_val != new_val:
                action = "status_changed" if field == "status" else "updated"
                ActivityService.log(
                    db, task_id,
                    user_id=current_user_id if hasattr(TaskService, '_current_user_id') else 1,
                    action=action,
                    field_name=field,
                    old_value=str(old_val) if old_val is not None else None,
                    new_value=str(new_val),
                )

        # Broadcast
        _broadcast({"event": "task_updated", "task_id": task_id, "updates": list(updates.keys())})

        return TaskService.get_task_details(db, task_id)
    
    @staticmethod
    def delete_task(db: Session, task_id: int, user_id: int = 1) -> bool:
        """Delete task"""
        # Broadcast before delete so task_id is still valid
        _broadcast({"event": "task_deleted", "task_id": task_id})
        return TaskRepository.delete(db, task_id)
    
    @staticmethod
    def list_tasks(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assignee: Optional[int] = None,
        search: Optional[str] = None,
        sort_by: str = "updated_at",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        """List tasks with pagination and filters"""
        
        # Validate pagination
        page = max(1, page)
        page_size = max(1, min(page_size, 100))  # Max 100 per page
        skip = (page - 1) * page_size
        
        # Get tasks and total count
        tasks, total = TaskRepository.list_tasks(
            db=db,
            skip=skip,
            limit=page_size,
            status=status,
            priority=priority,
            assignee=assignee,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        # Calculate pagination info
        total_pages = (total + page_size - 1) // page_size
        
        return {
            "items": [
                {
                    "id": task.id,
                    "title": task.title,
                    "issue_type": task.issue_type.value if task.issue_type else "story",
                    "story_points": task.story_points,
                    "epic_name": task.epic_name,
                    "sprint": task.sprint or "Sprint 1",
                    "status": task.status.value,
                    "priority": task.priority.value,
                    "assigned_user": {
                        "id": task.assigned_user.id,
                        "name": task.assigned_user.name,
                        "email": task.assigned_user.email,
                        "role": task.assigned_user.role
                    } if task.assigned_user else None,
                    "due_date": task.due_date,
                    "created_at": task.created_at,
                    "updated_at": task.updated_at
                }
                for task in tasks
            ],
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
        }
    
    @staticmethod
    def get_user_assigned_tasks(
        db: Session,
        user_id: int,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get tasks assigned to a user"""
        tasks = TaskRepository.get_user_tasks(db, user_id, status)
        
        return [
            {
                "id": task.id,
                "title": task.title,
                "status": task.status.value,
                "priority": task.priority.value,
                "due_date": task.due_date,
                "created_at": task.created_at,
                "updated_at": task.updated_at
            }
            for task in tasks
        ]
