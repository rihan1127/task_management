"""
User Service
Business logic for user operations
"""

from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import logging

from repositories.user_repository import UserRepository
from schemas.user_schema import UserCreate

logger = logging.getLogger(__name__)


class UserService:
    """Service for user operations"""

    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> Dict[str, Any]:
        """Create a new user, raising ValueError on duplicate email."""
        existing = UserRepository.get_by_email(db, user_data.email)
        if existing:
            raise ValueError(f"User with email '{user_data.email}' already exists")

        user = UserRepository.create(
            db=db,
            name=user_data.name,
            email=user_data.email,
            role=user_data.role,
        )
        logger.info(f"UserService: created user {user.id} ({user.email})")
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }

    @staticmethod
    def list_users(
        db: Session, skip: int = 0, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Return all active users."""
        users = UserRepository.get_all(db, skip=skip, limit=limit)
        return [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at,
                "updated_at": u.updated_at,
                "task_count": len(u.tasks_assigned),
            }
            for u in users
        ]

    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
        """Get a single user by ID, or None if not found."""
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            return None
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "task_count": len(user.tasks_assigned),
        }

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """Soft-delete a user (marks is_active = False)."""
        return UserRepository.delete(db, user_id)
