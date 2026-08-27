"""
Database Connection and Session Management
SQLAlchemy setup with proper connection pooling
"""

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import logging
from typing import Generator
from datetime import datetime

from config import settings
from database.base import Base

logger = logging.getLogger(__name__)

# ========================
# ENGINE CONFIGURATION
# ========================

# SQLite uses StaticPool for in-memory DB compatibility
engine_kwargs = {}
if "sqlite" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    engine_kwargs["poolclass"] = StaticPool
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    **engine_kwargs
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def init_db() -> None:
    """Initialize database tables"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were created
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.info(f"Database initialized. Tables: {tables}")
        
        # Seed initial data if needed
        db = SessionLocal()
        try:
            seed_initial_data(db)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise


def seed_initial_data(db: Session) -> None:
    """Seed initial data (users, tasks, comments) with Jira attributes"""
    from database.models import User, Task, Comment, TaskStatus, TaskPriority, IssueType
    from datetime import timedelta
    from utils.auth import hash_password

    # Check if users already exist
    existing_users = db.query(User).first()
    if existing_users:
        return

    # Create default users
    _pw = hash_password("password123")  # All demo users share this password
    default_users = [
        User(name="Alice Johnson", email="alice@company.com", role="admin", password_hash=_pw),
        User(name="Bob Smith", email="bob@company.com", role="manager", password_hash=_pw),
        User(name="Charlie Davis", email="charlie@company.com", role="developer", password_hash=_pw),
        User(name="Diana Wilson", email="diana@company.com", role="developer", password_hash=_pw),
        User(name="Eve Martinez", email="eve@company.com", role="analyst", password_hash=_pw),
    ]
    for user in default_users:
        db.add(user)
    db.commit()
    logger.info(f"Seeded {len(default_users)} default users")

    # Reload user IDs after commit
    users = db.query(User).all()
    alice, bob, charlie, diana, eve = users[0], users[1], users[2], users[3], users[4]
    now = datetime.utcnow()

    # Create sample Jira issues
    sample_tasks = [
        Task(
            title="Implement user authentication with JWT & RBAC",
            description="Set up JWT-based authentication for all API endpoints. Include refresh tokens, permission gates, and role hierarchy.",
            issue_type=IssueType.STORY,
            story_points=5,
            epic_name="Security & Auth",
            sprint="Sprint 1",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            assigned_to=charlie.id, created_by=alice.id,
            due_date=now + timedelta(days=3)
        ),
        Task(
            title="Design modern Atlassian-style onboarding flow",
            description="Create wireframes and high-fidelity designs for the new user onboarding experience with Jira aesthetics.",
            issue_type=IssueType.STORY,
            story_points=3,
            epic_name="User Experience",
            sprint="Sprint 1",
            status=TaskStatus.PENDING,
            priority=TaskPriority.MEDIUM,
            assigned_to=diana.id, created_by=bob.id,
            due_date=now + timedelta(days=7)
        ),
        Task(
            title="Set up CI/CD automated deployment pipeline",
            description="Configure GitHub Actions for automated testing and container deployment with health checks.",
            issue_type=IssueType.TASK,
            story_points=8,
            epic_name="DevOps & Infrastructure",
            sprint="Sprint 1",
            status=TaskStatus.COMPLETED,
            priority=TaskPriority.HIGH,
            assigned_to=charlie.id, created_by=alice.id,
            due_date=now - timedelta(days=5)
        ),
        Task(
            title="Migrate database to PostgreSQL cluster",
            description="Move from SQLite to PostgreSQL for production. Update connection strings, run migrations, validate data integrity.",
            issue_type=IssueType.TASK,
            story_points=5,
            epic_name="DevOps & Infrastructure",
            sprint="Sprint 1",
            status=TaskStatus.PENDING,
            priority=TaskPriority.URGENT,
            assigned_to=charlie.id, created_by=alice.id,
            due_date=now + timedelta(days=1)
        ),
        Task(
            title="Write OpenAPI Swagger API documentation",
            description="Document all REST endpoints using OpenAPI/Swagger. Include request/response examples and authentication details.",
            issue_type=IssueType.STORY,
            story_points=2,
            epic_name="Developer Platform",
            sprint="Sprint 1",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.MEDIUM,
            assigned_to=eve.id, created_by=bob.id,
            due_date=now + timedelta(days=5)
        ),
        Task(
            title="Fix critical race condition in webhook receiver",
            description="Users report intermittent dropped events when multiple webhooks arrive concurrently. Add atomic transactions.",
            issue_type=IssueType.BUG,
            story_points=3,
            epic_name="Security & Auth",
            sprint="Sprint 1",
            status=TaskStatus.BLOCKED,
            priority=TaskPriority.URGENT,
            assigned_to=charlie.id, created_by=alice.id,
            due_date=now - timedelta(days=2)
        ),
        Task(
            title="Implement real-time WebSocket activity sync",
            description="Broadcast task updates, comment additions, and state transitions to all connected client sessions via WebSocket.",
            issue_type=IssueType.STORY,
            story_points=5,
            epic_name="Real-time Collaboration",
            sprint="Sprint 1",
            status=TaskStatus.COMPLETED,
            priority=TaskPriority.HIGH,
            assigned_to=diana.id, created_by=bob.id,
            due_date=now - timedelta(days=1)
        ),
        Task(
            title="Build Backlog & Sprint Planning board",
            description="Provide an agile backlog management view where product owners can drag and prioritize issues into active sprints.",
            issue_type=IssueType.EPIC,
            story_points=13,
            epic_name="Agile Tooling",
            sprint="Backlog",
            status=TaskStatus.PENDING,
            priority=TaskPriority.MEDIUM,
            assigned_to=alice.id, created_by=alice.id,
            due_date=now + timedelta(days=14)
        ),
        Task(
            title="Fix dropdown z-index collision on mobile viewports",
            description="Dropdown menus rendered inside table rows get clipped when scrolling on mobile devices.",
            issue_type=IssueType.BUG,
            story_points=1,
            epic_name="User Experience",
            sprint="Backlog",
            status=TaskStatus.PENDING,
            priority=TaskPriority.LOW,
            assigned_to=diana.id, created_by=bob.id,
            due_date=now + timedelta(days=10)
        ),
        Task(
            title="Q3 performance review preparation",
            description="Gather metrics, prepare slides and talking points for the Q3 business review with stakeholders.",
            issue_type=IssueType.TASK,
            story_points=2,
            epic_name="Operations & Planning",
            sprint="Backlog",
            status=TaskStatus.PENDING,
            priority=TaskPriority.LOW,
            assigned_to=bob.id, created_by=alice.id,
            due_date=now + timedelta(days=14)
        ),
        Task(
            title="Implement full system dark mode",
            description="Add dark mode support across all views using CSS custom variables. Persist user preference in localStorage.",
            issue_type=IssueType.STORY,
            story_points=3,
            epic_name="User Experience",
            sprint="Sprint 1",
            status=TaskStatus.COMPLETED,
            priority=TaskPriority.LOW,
            assigned_to=diana.id, created_by=bob.id,
            due_date=now - timedelta(days=2)
        ),
        Task(
            title="Code review: Search feature",
            description="Review the pull request for the new full-text search feature. Focus on query optimization and edge cases.",
            issue_type=IssueType.TASK,
            story_points=1,
            epic_name="Developer Platform",
            sprint="Sprint 1",
            status=TaskStatus.COMPLETED,
            priority=TaskPriority.MEDIUM,
            assigned_to=charlie.id, created_by=charlie.id,
            due_date=now - timedelta(days=3)
        ),
        Task(
            title="Customer feedback analysis & NPS review",
            description="Analyze NPS survey results and support tickets from July. Identify top 5 pain points and propose solutions.",
            issue_type=IssueType.STORY,
            story_points=3,
            epic_name="Operations & Planning",
            sprint="Sprint 1",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.MEDIUM,
            assigned_to=eve.id, created_by=bob.id,
            due_date=now + timedelta(days=2)
        ),
        Task(
            title="Security audit & dependency vulnerability scan",
            description="Run npm audit and pip-audit across all services. Update vulnerable packages and document changes.",
            issue_type=IssueType.TASK,
            story_points=5,
            epic_name="Security & Auth",
            sprint="Sprint 1",
            status=TaskStatus.PENDING,
            priority=TaskPriority.HIGH,
            assigned_to=charlie.id, created_by=alice.id,
            due_date=now - timedelta(days=1)
        ),
        Task(
            title="Upgrade frontend core dependencies",
            description="Test and upgrade frontend build tools and libraries. Address breaking changes and update dependencies.",
            issue_type=IssueType.TASK,
            story_points=3,
            epic_name="Developer Platform",
            sprint="Backlog",
            status=TaskStatus.PENDING,
            priority=TaskPriority.MEDIUM,
            assigned_to=diana.id, created_by=bob.id,
            due_date=now + timedelta(days=30)
        ),
    ]

    for task in sample_tasks:
        db.add(task)
    db.commit()
    logger.info(f"Seeded {len(sample_tasks)} sample tasks")

    # Reload tasks
    tasks = db.query(Task).all()

    # Add sample comments
    sample_comments = [
        Comment(task_id=tasks[0].id, user_id=alice.id, comment="This is a high priority blocker. Please prioritize and aim for delivery by end of week."),
        Comment(task_id=tasks[0].id, user_id=charlie.id, comment="Working on it. The access token flow is done, refresh tokens need about 2 more days."),
        Comment(task_id=tasks[2].id, user_id=bob.id, comment="Great work! CI/CD is running smoothly. Deployment time dropped from 20 minutes to 5."),
        Comment(task_id=tasks[3].id, user_id=alice.id, comment="This needs to be done before the next sprint. Production data is growing fast."),
        Comment(task_id=tasks[3].id, user_id=charlie.id, comment="I'll need a full day of downtime window. Can we schedule Sunday night?"),
        Comment(task_id=tasks[5].id, user_id=alice.id, comment="This is now blocking the release. Please escalate to the payment team immediately."),
        Comment(task_id=tasks[5].id, user_id=charlie.id, comment="Root cause identified — Stripe sends different card object formats for EU cards. Fix in progress."),
        Comment(task_id=tasks[4].id, user_id=bob.id, comment="Swagger UI looks great. Make sure to add auth examples for the JWT endpoints."),
        Comment(task_id=tasks[9].id, user_id=eve.id, comment="Preliminary results show navigation confusion is the #1 issue. Proposing a sidebar redesign."),
    ]

    for comment in sample_comments:
        db.add(comment)
    db.commit()
    logger.info(f"Seeded {len(sample_comments)} sample comments")


def get_db() -> Generator[Session, None, None]:
    """Get database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def close_db() -> None:
    """Close database connection"""
    engine.dispose()
    logger.info("Database connection closed")
