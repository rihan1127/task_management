"""
Groq AI Routes
API endpoints for AI-powered task analysis features
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import logging

from services.groq_ai_service import groq_service
from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


# ──────────────────────────────────────────────────────────────────────────────
# Request Schemas
# ──────────────────────────────────────────────────────────────────────────────

class TaskAnalysisRequest(BaseModel):
    title: str
    description: Optional[str] = ""

class EffortEstimationRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "feature"

class DescriptionEnhanceRequest(BaseModel):
    title: str
    description: Optional[str] = ""


# ──────────────────────────────────────────────────────────────────────────────
# AI Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/analyze", summary="Full AI task analysis (priority + category + points)")
async def analyze_task(
    request: TaskAnalysisRequest,
    current_user=Depends(get_current_user),
):
    """
    Perform a full Groq AI analysis in a single request:
    - Priority suggestion (low/medium/high/urgent)
    - Category classification (bug/feature/improvement/...)
    - Story point estimation (Fibonacci: 1,2,3,5,8,13)

    ⚡ Powered by Groq — typically responds in < 150ms.
    """
    if not request.title.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Task title is required for AI analysis."
        )
    return await groq_service.analyze_task(request.title, request.description or "")


@router.post("/suggest-priority", summary="AI priority suggestion")
async def suggest_priority(
    request: TaskAnalysisRequest,
    current_user=Depends(get_current_user),
):
    """
    Suggest a priority level for a task based on its title and description.

    Returns: priority, confidence score (0-1), and reasoning.
    ⚡ Ultra-fast via Groq LPU inference.
    """
    if not request.title.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Task title is required."
        )
    return await groq_service.suggest_priority(request.title, request.description or "")


@router.post("/categorize", summary="AI task categorization")
async def categorize_task(
    request: TaskAnalysisRequest,
    current_user=Depends(get_current_user),
):
    """
    Classify a task into a software development category.

    Categories: bug, feature, improvement, documentation, refactor, test, deployment, security
    """
    if not request.title.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Task title is required."
        )
    return await groq_service.categorize_task(request.title, request.description or "")


@router.post("/estimate-effort", summary="AI story point estimation")
async def estimate_effort(
    request: EffortEstimationRequest,
    current_user=Depends(get_current_user),
):
    """
    Estimate Fibonacci story points for a task.

    Returns one of: 1, 2, 3, 5, 8, 13 points with confidence and reasoning.
    """
    if not request.title.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Task title is required."
        )
    return await groq_service.estimate_story_points(
        request.title,
        request.description or "",
        request.category or "feature",
    )


@router.post("/enhance-description", summary="AI description enhancement")
async def enhance_description(
    request: DescriptionEnhanceRequest,
    current_user=Depends(get_current_user),
):
    """
    Enhance a task description with structured acceptance criteria and technical notes.

    Returns an improved, actionable task description.
    """
    if not request.title.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Task title is required."
        )
    return await groq_service.enhance_description(request.title, request.description or "")


@router.get("/status", summary="AI service status")
async def ai_status(current_user=Depends(get_current_user)):
    """Check if Groq AI is configured and available."""
    return {
        "ai_enabled": groq_service.enabled,
        "provider": "groq",
        "model": groq_service.model if groq_service.enabled else None,
        "features": [
            "suggest-priority",
            "categorize",
            "estimate-effort",
            "enhance-description",
            "analyze",
        ] if groq_service.enabled else [],
    }
