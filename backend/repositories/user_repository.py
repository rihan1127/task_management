"""
User Repository
Data access layer for users
"""

from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import logging

from database.models import User

logger = logging.getLogger(__name__)


class UserRepository:
    """Repository for user operations"""
    
    @staticmethod
    def create(db: Session, name: str, email: str, role: str = "developer") -> User:
        """Create a new user"""
        user = User(name=name, email=email, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created user {user.id}: {email}")
        return user
    
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users"""
        return db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
    
    @staticmethod
    def update(db: Session, user_id: int, updates: Dict[str, Any]) -> Optional[User]:
        """Update user"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        for key, value in updates.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        logger.info(f"Updated user {user_id}")
        return user
    
    @staticmethod
    def delete(db: Session, user_id: int) -> bool:
        """Soft delete user (set is_active to False)"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        user.is_active = False
        db.commit()
        logger.info(f"Deleted user {user_id}")
        return True
    
    @staticmethod
    def count(db: Session) -> int:
        """Count active users"""
        return db.query(User).filter(User.is_active == True).count()
