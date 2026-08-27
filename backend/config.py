"""
Application Configuration
Environment-based settings for production readiness
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import os
import json
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "Task Management Dashboard"
    DEBUG: bool = os.getenv("DEBUG", "False") == "True"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./task_management.db"
    )
    DATABASE_ECHO: bool = os.getenv("DATABASE_ECHO", "False") == "True"
    
    # Server
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    ALLOWED_HOSTS: Union[List[str], str] = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
    ]

    @field_validator("ALLOWED_ORIGINS", "ALLOWED_HOSTS", mode="before")
    @classmethod
    def assemble_list_fields(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped:
                return []
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [i.strip() for i in v_stripped.split(",") if i.strip()]
        elif isinstance(v, (list, tuple, set)):
            return list(v)
        return []
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # API Keys for external services
    GITHUB_API_TOKEN: str = os.getenv("GITHUB_API_TOKEN", "")
    EXTERNAL_API_TIMEOUT: int = 30

    # Groq AI Configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "groq/compound-mini")
    AI_ENABLED: bool = os.getenv("AI_ENABLED", "true").lower() == "true"
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
