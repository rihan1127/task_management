"""
Comments Routes
REST API endpoints for task comments and notes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from database.connection import get_db
from schemas.comment_schema import CommentCreate
from services.comment_service import CommentService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_current_user_id() -> int:
    """Get current user ID (mock for now — replace with JWT in production)"""
    return 1


@router.post("/tasks/{task_id}", status_code=status.HTTP_201_CREATED)
async def create_comment(
    task_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Add a comment/note to a task

    - **task_id**: Task ID
    - **comment**: Comment text
    """
    try:
        result = CommentService.create_comment(
            db=db,
            task_id=task_id,
            user_id=current_user_id,
            comment_text=comment_data.comment,
        )
        return {"status": "success", "message": "Comment added successfully", **result}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error creating comment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating comment",
        )


@router.get("/tasks/{task_id}")
async def get_task_comments(
    task_id: int,
    db: Session = Depends(get_db),
):
    """Get all comments for a task"""
    try:
        comments = CommentService.get_task_comments(db, task_id)
        return {
            "status": "success",
            "task_id": task_id,
            "total": len(comments),
            "comments": comments,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error fetching comments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching comments",
        )


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """Delete a comment (only by author)"""
    try:
        CommentService.delete_comment(
            db=db, comment_id=comment_id, current_user_id=current_user_id
        )
        logger.info(f"Comment {comment_id} deleted")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error deleting comment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting comment",
        )
