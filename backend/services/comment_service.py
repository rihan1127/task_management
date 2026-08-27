"""
Comment Service
Business logic for task comments / notes
"""

from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import logging

from repositories.comment_repository import CommentRepository
from repositories.task_repository import TaskRepository

logger = logging.getLogger(__name__)


class CommentService:
    """Service for comment operations"""

    @staticmethod
    def create_comment(
        db: Session, task_id: int, user_id: int, comment_text: str
    ) -> Dict[str, Any]:
        """Create a comment on a task, validating task existence."""
        task = TaskRepository.get_by_id(db, task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        comment = CommentRepository.create(
            db=db, task_id=task_id, user_id=user_id, comment=comment_text
        )
        logger.info(f"CommentService: created comment {comment.id} on task {task_id}")
        return {
            "id": comment.id,
            "task_id": task_id,
            "comment": comment.comment,
            "author": {
                "id": comment.author.id,
                "name": comment.author.name,
                "email": comment.author.email,
                "role": comment.author.role,
            },
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
        }

    @staticmethod
    def get_task_comments(db: Session, task_id: int) -> List[Dict[str, Any]]:
        """Return all comments for a task."""
        task = TaskRepository.get_by_id(db, task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        comments = CommentRepository.get_task_comments(db, task_id)
        return [
            {
                "id": c.id,
                "comment": c.comment,
                "author": {
                    "id": c.author.id,
                    "name": c.author.name,
                    "email": c.author.email,
                    "role": c.author.role,
                },
                "created_at": c.created_at,
                "updated_at": c.updated_at,
            }
            for c in comments
        ]

    @staticmethod
    def delete_comment(
        db: Session, comment_id: int, current_user_id: int
    ) -> bool:
        """Delete a comment. Only the author may delete their own comment."""
        comment = CommentRepository.get_by_id(db, comment_id)
        if not comment:
            raise ValueError(f"Comment {comment_id} not found")
        if comment.user_id != current_user_id:
            raise PermissionError("Cannot delete a comment authored by another user")
        return CommentRepository.delete(db, comment_id)
