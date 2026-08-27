"""
Comment Schemas
Pydantic models for comment-related requests/responses
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CommentCreate(BaseModel):
    """Create comment request schema"""
    comment: str = Field(..., min_length=1, max_length=5000)
    
    @property
    def cleaned_comment(self) -> str:
        return self.comment.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "comment": "This task is now assigned to the backend team"
            }
        }


class CommentResponse(BaseModel):
    """Comment response schema"""
    id: int
    task_id: int
    user_id: int
    comment: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
