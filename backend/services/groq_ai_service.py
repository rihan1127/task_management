"""
Groq AI Service
Ultra-fast AI features for task management using Groq's LPU inference engine
"""

from groq import Groq
import os
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)


from config import settings

class GroqAIService:
    """
    AI service powered by Groq's ultra-fast LPU inference.
    Typical response times: 50-150ms (10-100x faster than other providers).
    """

    def __init__(self):
        api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        self.enabled = bool(api_key)
        self.client = Groq(api_key=api_key) if self.enabled else None
        self.model = settings.GROQ_MODEL or os.getenv("GROQ_MODEL", "groq/compound-mini")
        if not self.enabled:
            logger.warning("GROQ_API_KEY not set - AI features disabled.")
        else:
            logger.info(f"Groq AI service initialized with model: {self.model}")

    def _chat(self, system: str, user: str, max_tokens: int = 300) -> Optional[str]:
        """Internal helper: call Groq chat completions and return raw text."""
        if not self.enabled or not self.client:
            return None
        
        models_to_try = [self.model, "groq/compound-mini", "openai/gpt-oss-20b", "groq/compound"]
        seen = set()
        unique_models = []
        for m in models_to_try:
            if m and m not in seen:
                seen.add(m)
                unique_models.append(m)

        for model in unique_models:
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    max_tokens=max_tokens,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                )
                return response.choices[0].message.content.strip()
            except Exception as exc:
                logger.warning(f"Groq API error with model {model}: {exc}")
                continue
        return None

    # ──────────────────────────────────────────────────────────────────────────
    # FEATURE 1: Auto Priority Suggestion
    # ──────────────────────────────────────────────────────────────────────────

    async def suggest_priority(self, title: str, description: str) -> dict:
        """
        Suggest task priority using Groq AI.
        Returns priority level (low/medium/high/urgent), confidence, and reasoning.
        """
        system = """You are a task prioritization expert for software engineering teams.

Priority definitions:
- low: Nice-to-have, minimal user impact, can wait weeks
- medium: Important feature or improvement, moderate impact, should be done in days
- high: Urgent issue affecting users or product quality, needs to be done soon
- urgent: Critical — security breach, data loss, system down, blocks many users

Respond ONLY with valid JSON. No markdown, no extra text."""

        user = f"""Task to prioritize:
Title: {title}
Description: {description or 'No description provided.'}

Respond ONLY with this exact JSON:
{{"priority": "high", "confidence": 0.87, "reasoning": "Brief explanation in 1-2 sentences."}}"""

        raw = self._chat(system, user, max_tokens=250)
        if raw is None:
            return {"status": "disabled", "suggested_priority": "medium"}

        try:
            # Strip markdown fences if model wraps in ```json
            clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            result = json.loads(clean)
            return {
                "status": "success",
                "suggested_priority": result.get("priority", "medium").lower(),
                "confidence": float(result.get("confidence", 0.5)),
                "reasoning": result.get("reasoning", ""),
                "provider": "groq",
                "model": self.model,
            }
        except (json.JSONDecodeError, ValueError) as exc:
            logger.error(f"Priority parse error: {exc} | raw: {raw[:200]}")
            return {"status": "error", "suggested_priority": "medium", "message": "Parse error"}

    # ──────────────────────────────────────────────────────────────────────────
    # FEATURE 2: Task Categorization
    # ──────────────────────────────────────────────────────────────────────────

    async def categorize_task(self, title: str, description: str) -> dict:
        """
        Categorize a task into software development categories.
        Categories: bug, feature, improvement, documentation, refactor, test, deployment, security
        """
        system = """You are a software engineering analyst.
Classify software tasks into one of these categories:
bug, feature, improvement, documentation, refactor, test, deployment, security

Respond ONLY with valid JSON. No markdown, no extra text."""

        user = f"""Task:
Title: {title}
Description: {description or 'No description.'}

Respond ONLY with:
{{"category": "bug", "confidence": 0.92, "reasoning": "Brief explanation."}}"""

        raw = self._chat(system, user, max_tokens=200)
        if raw is None:
            return {"status": "disabled", "category": "feature"}

        try:
            clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            result = json.loads(clean)
            return {
                "status": "success",
                "category": result.get("category", "feature").lower(),
                "confidence": float(result.get("confidence", 0.5)),
                "reasoning": result.get("reasoning", ""),
                "provider": "groq",
            }
        except (json.JSONDecodeError, ValueError) as exc:
            logger.error(f"Categorize parse error: {exc} | raw: {raw[:200]}")
            return {"status": "error", "category": "feature", "message": "Parse error"}

    # ──────────────────────────────────────────────────────────────────────────
    # FEATURE 3: Story Point Estimation
    # ──────────────────────────────────────────────────────────────────────────

    async def estimate_story_points(self, title: str, description: str, category: str = "feature") -> dict:
        """
        Estimate Fibonacci story points for a task.
        Uses scale: 1, 2, 3, 5, 8, 13
        """
        system = """You are a senior software engineer helping estimate effort using Fibonacci story points.

Scale:
1 pt  = trivial change, <1 hour
2 pts = simple task, 1-3 hours
3 pts = small task, half a day
5 pts = medium task, 1-2 days
8 pts = large task, 3-5 days
13 pts = very complex, needs breakdown (1+ week)

Respond ONLY with valid JSON. No markdown, no extra text."""

        user = f"""Task:
Title: {title}
Description: {description or 'No description.'}
Category: {category}

Valid points values: 1, 2, 3, 5, 8, 13

Respond ONLY with:
{{"points": 5, "confidence": 0.8, "reasoning": "Why this estimate in 1-2 sentences."}}"""

        raw = self._chat(system, user, max_tokens=200)
        if raw is None:
            return {"status": "disabled", "estimated_points": 3}

        try:
            clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            result = json.loads(clean)
            pts = int(result.get("points", 3))
            # Clamp to valid Fibonacci values
            fib = [1, 2, 3, 5, 8, 13]
            pts = min(fib, key=lambda x: abs(x - pts))
            return {
                "status": "success",
                "estimated_points": pts,
                "confidence": float(result.get("confidence", 0.5)),
                "reasoning": result.get("reasoning", ""),
                "provider": "groq",
            }
        except (json.JSONDecodeError, ValueError) as exc:
            logger.error(f"Estimation parse error: {exc} | raw: {raw[:200]}")
            return {"status": "error", "estimated_points": 3, "message": "Parse error"}

    # ──────────────────────────────────────────────────────────────────────────
    # FEATURE 4: Smart Description Enhancement
    # ──────────────────────────────────────────────────────────────────────────

    async def enhance_description(self, title: str, description: str) -> dict:
        """
        Enhance a task description with structured acceptance criteria and technical notes.
        """
        system = """You are an experienced software engineering lead who writes excellent task descriptions.
Enhance task descriptions to include:
- Clear objective
- Acceptance criteria (as bullet points)
- Technical notes (if relevant)
Keep it concise and actionable. Plain text only, no markdown headers."""

        user = f"""Task title: {title}
Original description: {description or 'No description provided.'}

Write an enhanced task description (max 150 words). Plain text only."""

        raw = self._chat(system, user, max_tokens=300)
        if raw is None:
            return {"status": "disabled"}

        return {
            "status": "success",
            "enhanced_description": raw,
            "provider": "groq",
        }

    # ──────────────────────────────────────────────────────────────────────────
    # FEATURE 5: Full AI Analysis (combines all features)
    # ──────────────────────────────────────────────────────────────────────────

    async def analyze_task(self, title: str, description: str) -> dict:
        """
        Full analysis: priority + category + story points in one call.
        More efficient than 3 separate calls.
        """
        system = """You are an AI assistant for an Agile software team. Analyze tasks and return JSON.

Priority: low | medium | high | urgent
Category: bug | feature | improvement | documentation | refactor | test | deployment | security
Story points (Fibonacci): 1, 2, 3, 5, 8, 13

Respond ONLY with valid JSON. No markdown, no extra text."""

        user = f"""Analyze this task:
Title: {title}
Description: {description or 'No description provided.'}

Respond ONLY with this JSON structure:
{{
  "priority": "high",
  "priority_confidence": 0.87,
  "priority_reasoning": "Explanation",
  "category": "bug",
  "category_confidence": 0.91,
  "category_reasoning": "Explanation",
  "story_points": 5,
  "points_confidence": 0.75,
  "points_reasoning": "Explanation"
}}"""

        raw = self._chat(system, user, max_tokens=400)
        if raw is None:
            return {
                "status": "disabled",
                "priority": {"suggested_priority": "medium", "confidence": 0, "reasoning": "AI disabled"},
                "category": {"category": "feature", "confidence": 0, "reasoning": "AI disabled"},
                "story_points": {"estimated_points": 3, "confidence": 0, "reasoning": "AI disabled"},
            }

        try:
            clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            r = json.loads(clean)
            fib = [1, 2, 3, 5, 8, 13]
            pts_raw = int(r.get("story_points", 3))
            pts = min(fib, key=lambda x: abs(x - pts_raw))
            return {
                "status": "success",
                "provider": "groq",
                "model": self.model,
                "priority": {
                    "suggested_priority": r.get("priority", "medium").lower(),
                    "confidence": float(r.get("priority_confidence", 0.5)),
                    "reasoning": r.get("priority_reasoning", ""),
                },
                "category": {
                    "category": r.get("category", "feature").lower(),
                    "confidence": float(r.get("category_confidence", 0.5)),
                    "reasoning": r.get("category_reasoning", ""),
                },
                "story_points": {
                    "estimated_points": pts,
                    "confidence": float(r.get("points_confidence", 0.5)),
                    "reasoning": r.get("points_reasoning", ""),
                },
            }
        except (json.JSONDecodeError, ValueError) as exc:
            logger.error(f"Full analysis parse error: {exc} | raw: {raw[:300]}")
            return {"status": "error", "message": "Failed to parse AI analysis"}


# Singleton instance
groq_service = GroqAIService()
