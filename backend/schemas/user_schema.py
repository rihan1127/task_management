"""
User Schemas
Pydantic models for user-related requests/responses
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Create user request schema"""
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    role: str = Field(default="developer", pattern="^(admin|manager|developer|analyst)$")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john@company.com",
                "role": "developer"
            }
        }


class UserUpdate(BaseModel):
    """Update user request schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, pattern="^(admin|manager|developer|analyst)$")
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """User response schema"""
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Minimal user info for lists"""
    id: int
    name: str
    email: str
    role: str
    
    class Config:
        from_attributes = True
