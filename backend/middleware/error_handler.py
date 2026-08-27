"""
Global Exception Handler
Centralized error handling
"""

from fastapi import status
from fastapi.responses import JSONResponse
from fastapi.requests import Request
import logging
import traceback

logger = logging.getLogger(__name__)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle uncaught exceptions globally"""
    
    # Log the exception
    logger.error(
        f"Unhandled exception: {str(exc)}",
        exc_info=True,
        extra={
            "path": request.url.path,
            "method": request.method,
            "client": request.client.host if request.client else "unknown"
        }
    )
    
    # Return generic error response
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "detail": "Internal server error",
            "type": exc.__class__.__name__
        }
    )
