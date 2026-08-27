"""
Comment Repository
Data access layer for comments
"""

from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from database.models import Comment

logger = logging.getLogger(__name__)


class CommentRepository:
    """Repository for comment operations"""
    
    @staticmethod
    def create(db: Session, task_id: int, user_id: int, comment: str) -> Comment:
        """Create a new comment"""
        new_comment = Comment(
            task_id=task_id,
            user_id=user_id,
            comment=comment.strip()
        )
        db.add(new_comment)
        db.commit()
        db.refresh(new_comment)
        logger.info(f"Created comment {new_comment.id} on task {task_id}")
        return new_comment
    
    @staticmethod
    def get_by_id(db: Session, comment_id: int) -> Optional[Comment]:
        """Get comment by ID"""
        return db.query(Comment).filter(Comment.id == comment_id).first()
    
    @staticmethod
    def get_task_comments(db: Session, task_id: int) -> List[Comment]:
        """Get all comments for a task"""
        return db.query(Comment).filter(
            Comment.task_id == task_id
        ).order_by(Comment.created_at.desc()).all()
    
    @staticmethod
    def delete(db: Session, comment_id: int) -> bool:
        """Delete comment"""
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if not comment:
            return False
        
        db.delete(comment)
        db.commit()
        logger.info(f"Deleted comment {comment_id}")
        return True
