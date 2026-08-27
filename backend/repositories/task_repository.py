"""
Task Repository
Data access layer for tasks
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from database.models import Task, TaskStatus, TaskPriority, IssueType

logger = logging.getLogger(__name__)


class TaskRepository:
    """Repository for task operations"""
    
    @staticmethod
    def create(db: Session, title: str, description: Optional[str],
               priority: str, assigned_to: Optional[int], 
               created_by: int, due_date: Optional[datetime] = None,
               issue_type: str = "story", story_points: Optional[int] = None,
               epic_name: Optional[str] = None, sprint: Optional[str] = "Sprint 1") -> Task:
        """Create a new task / Jira issue"""
        task = Task(
            title=title,
            description=description,
            issue_type=IssueType(issue_type.value if hasattr(issue_type, 'value') else issue_type),
            story_points=story_points,
            epic_name=epic_name,
            sprint=sprint,
            priority=TaskPriority(priority.value if hasattr(priority, 'value') else priority),
            assigned_to=assigned_to,
            created_by=created_by,
            due_date=due_date,
            status=TaskStatus.PENDING
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        logger.info(f"Created task {task.id}: {title}")
        return task
    
    @staticmethod
    def get_by_id(db: Session, task_id: int) -> Optional[Task]:
        """Get task by ID"""
        return db.query(Task).filter(Task.id == task_id).first()
    
    @staticmethod
    def update(db: Session, task_id: int, updates: Dict[str, Any]) -> Optional[Task]:
        """Update task"""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None
        
        # Convert enum strings/values to enums
        if "status" in updates and updates["status"] is not None:
            val = updates["status"].value if hasattr(updates["status"], 'value') else updates["status"]
            updates["status"] = TaskStatus(val)
        if "priority" in updates and updates["priority"] is not None:
            val = updates["priority"].value if hasattr(updates["priority"], 'value') else updates["priority"]
            updates["priority"] = TaskPriority(val)
        if "issue_type" in updates and updates["issue_type"] is not None:
            val = updates["issue_type"].value if hasattr(updates["issue_type"], 'value') else updates["issue_type"]
            updates["issue_type"] = IssueType(val)
        
        for key, value in updates.items():
            if hasattr(task, key):
                setattr(task, key, value)
        
        db.commit()
        db.refresh(task)
        logger.info(f"Updated task {task_id}")
        return task
    
    @staticmethod
    def delete(db: Session, task_id: int) -> bool:
        """Delete task"""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return False
        
        db.delete(task)
        db.commit()
        logger.info(f"Deleted task {task_id}")
        return True
    
    @staticmethod
    def list_tasks(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assignee: Optional[int] = None,
        search: Optional[str] = None,
        sort_by: str = "updated_at",
        sort_order: str = "desc"
    ) -> tuple[List[Task], int]:
        """List tasks with filters and pagination"""
        
        query = db.query(Task)
        
        # Apply filters
        if status:
            try:
                query = query.filter(Task.status == TaskStatus(status))
            except ValueError:
                pass
        
        if priority:
            try:
                query = query.filter(Task.priority == TaskPriority(priority))
            except ValueError:
                pass
        
        if assignee:
            query = query.filter(Task.assigned_to == assignee)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Task.title.ilike(search_term),
                    Task.description.ilike(search_term)
                )
            )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(Task, sort_by, Task.updated_at)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Apply pagination
        tasks = query.offset(skip).limit(limit).all()
        
        return tasks, total
    
    @staticmethod
    def get_user_tasks(
        db: Session,
        user_id: int,
        status: Optional[str] = None
    ) -> List[Task]:
        """Get tasks assigned to a user"""
        query = db.query(Task).filter(Task.assigned_to == user_id)
        
        if status:
            try:
                query = query.filter(Task.status == TaskStatus(status))
            except ValueError:
                pass
        
        return query.order_by(Task.due_date, Task.updated_at).all()
    
    @staticmethod
    def get_overdue_tasks(db: Session) -> List[Task]:
        """Get overdue tasks"""
        now = datetime.utcnow()
        return db.query(Task).filter(
            and_(
                Task.due_date < now,
                Task.status != TaskStatus.COMPLETED
            )
        ).all()
    
    @staticmethod
    def get_task_stats(db: Session) -> Dict[str, int]:
        """Get task statistics"""
        return {
            "total": db.query(Task).count(),
            "pending": db.query(Task).filter(Task.status == TaskStatus.PENDING).count(),
            "in_progress": db.query(Task).filter(Task.status == TaskStatus.IN_PROGRESS).count(),
            "completed": db.query(Task).filter(Task.status == TaskStatus.COMPLETED).count(),
            "blocked": db.query(Task).filter(Task.status == TaskStatus.BLOCKED).count(),
        }
