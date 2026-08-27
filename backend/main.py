"""
Task Management Dashboard - FastAPI Backend
Production-ready task management system with proper architecture
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from typing import Callable

from database.connection import init_db, get_db
from routes import tasks, users, dashboard, comments, external
from routes import auth as auth_routes
from routes import activity as activity_routes
from routes import ws as ws_routes
from middleware.error_handler import global_exception_handler
from config import settings
from utils.logger import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    logger.info("Application starting...")
    init_db()
    yield
    logger.info("Application shutting down...")


app = FastAPI(
    title="Task Management Dashboard API",
    description="Enterprise-grade task management system",
    version="1.0.0",
    lifespan=lifespan
)

# ========================
# MIDDLEWARE CONFIGURATION
# ========================

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host Middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Global Exception Handler
app.add_exception_handler(Exception, global_exception_handler)

# ========================
# ROUTE REGISTRATION
# ========================

app.include_router(
    users.router,
    prefix="/api/users",
    tags=["Users"]
)

app.include_router(
    tasks.router,
    prefix="/api/tasks",
    tags=["Tasks"]
)

app.include_router(
    dashboard.router,
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

app.include_router(
    comments.router,
    prefix="/api/comments",
    tags=["Comments"]
)

app.include_router(
    external.router,
    prefix="/api/external",
    tags=["External APIs"]
)

app.include_router(
    auth_routes.router,
    prefix="/api/auth",
    tags=["Auth"]
)

app.include_router(
    activity_routes.router,
    prefix="/api/activity",
    tags=["Activity"]
)

app.include_router(
    ws_routes.router,
    prefix="/ws",
    tags=["WebSocket"]
)

# ========================
# HEALTH CHECK ENDPOINTS
# ========================

@app.get("/health", tags=["Health"])
async def health_check():
    """Application health check"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "Task Management Dashboard"
    }


@app.get("/api/health", tags=["Health"])
async def api_health_check():
    """API health check with DB connectivity"""
    try:
        db = next(get_db())
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unavailable"
        )


# ========================
# ROOT ENDPOINT
# ========================

@app.get("/", tags=["Root"])
async def root():
    """API root endpoint"""
    return {
        "message": "Task Management Dashboard API",
        "docs": "/docs",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
