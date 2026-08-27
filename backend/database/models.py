"""
Database Models
SQLAlchemy ORM models for the application
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from database.base import Base


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(String(50), default="developer", nullable=False)  # admin, manager, developer, analyst
    password_hash = Column(String(255), nullable=True)  # nullable for seeded/legacy users
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    tasks_assigned = relationship("Task", back_populates="assigned_user", foreign_keys="Task.assigned_to")
    comments = relationship("Comment", back_populates="author")
    
    def __repr__(self) -> str:
        return f"<User {self.id}: {self.email}>"


class IssueType(str, enum.Enum):
    """Jira Issue Type enumeration"""
    STORY = "story"
    BUG = "bug"
    TASK = "task"
    EPIC = "epic"


class TaskStatus(str, enum.Enum):
    """Task status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class TaskPriority(str, enum.Enum):
    """Task priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(Base):
    """Task / Jira Issue model"""
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    issue_type = Column(
        Enum(IssueType),
        default=IssueType.STORY,
        nullable=False,
        index=True
    )
    story_points = Column(Integer, nullable=True)
    epic_name = Column(String(100), nullable=True, index=True)
    sprint = Column(String(100), default="Sprint 1", nullable=True, index=True)
    status = Column(
        Enum(TaskStatus),
        default=TaskStatus.PENDING,
        nullable=False,
        index=True
    )
    priority = Column(
        Enum(TaskPriority),
        default=TaskPriority.MEDIUM,
        nullable=False,
        index=True
    )
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    assigned_user = relationship(
        "User",
        back_populates="tasks_assigned",
        foreign_keys=[assigned_to],
        lazy="joined"
    )
    creator = relationship(
        "User",
        foreign_keys=[created_by],
        lazy="joined"
    )
    comments = relationship(
        "Comment",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="joined"
    )
    
    # Indexes for common queries
    __table_args__ = (
        Index("idx_task_status_priority", "status", "priority"),
        Index("idx_task_assigned_to_status", "assigned_to", "status"),
        Index("idx_task_due_date", "due_date"),
    )
    
    def __repr__(self) -> str:
        return f"<Task {self.id}: {self.title}>"


class Comment(Base):
    """Comment/Note model"""
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    task = relationship("Task", back_populates="comments")
    author = relationship("User", back_populates="comments", lazy="joined")
    
    def __repr__(self) -> str:
        return f"<Comment {self.id}: Task {self.task_id}>"


class TaskActivity(Base):
    """Task audit log — records every state change on a task."""
    __tablename__ = "task_activities"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(50), nullable=False)  # created, updated, status_changed, commented, deleted
    field_name = Column(String(100), nullable=True)   # which field changed
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<TaskActivity {self.id}: {self.action} on Task {self.task_id}>"
