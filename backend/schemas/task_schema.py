"""
Task Schemas
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class IssueTypeEnum(str, Enum):
    STORY = "story"
    BUG = "bug"
    TASK = "task"
    EPIC = "epic"


class TaskStatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class TaskPriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ========================
# REQUEST SCHEMAS
# ========================

class TaskCreate(BaseModel):
    """Create task request schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    issue_type: Optional[IssueTypeEnum] = IssueTypeEnum.STORY
    story_points: Optional[int] = None
    epic_name: Optional[str] = None
    sprint: Optional[str] = "Sprint 1"
    assigned_to: Optional[int] = None
    priority: TaskPriorityEnum = TaskPriorityEnum.MEDIUM
    due_date: Optional[datetime] = None
    
    @validator("title")
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()
    
    @validator("description")
    def clean_description(cls, v):
        if v:
            return v.strip()
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Implement user authentication",
                "description": "Add JWT-based authentication to the API",
                "issue_type": "story",
                "story_points": 5,
                "epic_name": "User Management",
                "sprint": "Sprint 1",
                "assigned_to": 1,
                "priority": "high",
                "due_date": "2024-12-31T23:59:59"
            }
        }


class TaskUpdate(BaseModel):
    """Update task request schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    issue_type: Optional[IssueTypeEnum] = None
    story_points: Optional[int] = None
    epic_name: Optional[str] = None
    sprint: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    assigned_to: Optional[int] = None
    priority: Optional[TaskPriorityEnum] = None
    due_date: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "in_progress",
                "story_points": 8,
                "assigned_to": 2,
                "priority": "urgent"
            }
        }


# ========================
# RESPONSE SCHEMAS
# ========================

class UserBasic(BaseModel):
    """Basic user info"""
    id: int
    name: str
    email: str
    role: str
    
    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    """Comment response schema"""
    id: int
    comment: str
    author: UserBasic
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TaskResponse(BaseModel):
    """Task response schema"""
    id: int
    title: str
    description: Optional[str]
    issue_type: Optional[IssueTypeEnum] = IssueTypeEnum.STORY
    story_points: Optional[int] = None
    epic_name: Optional[str] = None
    sprint: Optional[str] = "Sprint 1"
    status: TaskStatusEnum
    priority: TaskPriorityEnum
    assigned_user: Optional[UserBasic]
    creator: UserBasic
    comments: List[CommentResponse] = []
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Task list response (minimal data)"""
    id: int
    title: str
    issue_type: Optional[IssueTypeEnum] = IssueTypeEnum.STORY
    story_points: Optional[int] = None
    epic_name: Optional[str] = None
    sprint: Optional[str] = "Sprint 1"
    status: TaskStatusEnum
    priority: TaskPriorityEnum
    assigned_user: Optional[UserBasic]
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ========================
# PAGINATION SCHEMAS
# ========================

class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    items: List[TaskListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 42,
                "page": 1,
                "page_size": 20,
                "total_pages": 3,
                "has_next": True,
                "has_previous": False
            }
        }
