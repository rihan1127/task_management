# System Architecture

## Overview

The Task Management Dashboard follows a modern, layered architecture with clear separation of concerns. This document outlines the system design, patterns, and best practices used throughout the application.

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Data Flow](#data-flow)
5. [Design Patterns](#design-patterns)
6. [Database Design](#database-design)
7. [API Design](#api-design)
8. [Security Architecture](#security-architecture)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           React Single-Page Application              │ │
│  │  (Components, Services, State Management)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (FastAPI)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Routes → Services → Repositories → Database           │ │
│  │ (Request Handling, Business Logic, Data Access)       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer (Database)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     PostgreSQL / SQLite (ORM: SQLAlchemy)             │ │
│  │  (Persistence, Relationships, Queries)                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Layered Architecture

The backend follows a **4-layer architecture**:

```
HTTP Requests
     ↓
┌──────────────────────────────────┐
│  Routes/Controllers              │ - HTTP endpoint definitions
│  (routes/tasks.py)               │ - Request validation
└──────────────────────────────────┘
     ↓
┌──────────────────────────────────┐
│  Business Logic/Services         │ - Core business rules
│  (services/task_service.py)      │ - Complex operations
└──────────────────────────────────┘
     ↓
┌──────────────────────────────────┐
│  Data Access/Repositories        │ - Database queries
│  (repositories/task_repository.py) │ - Data operations
└──────────────────────────────────┘
     ↓
┌──────────────────────────────────┐
│  Database Models                 │ - ORM definitions
│  (database/models.py)            │ - Schema representation
└──────────────────────────────────┘
     ↓
  Database (PostgreSQL/SQLite)
```

### Layer Responsibilities

#### Routes Layer
- HTTP endpoint definitions
- Request parameter validation
- Response formatting
- Error handling

```python
@router.post("/tasks")
async def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    return TaskService.create_task(db, task_data)
```

#### Services Layer
- Business logic implementation
- Data validation beyond schema
- Complex operations combining multiple entities
- Transaction management

```python
class TaskService:
    @staticmethod
    def create_task(db: Session, task_data: TaskCreate):
        # Validate assigned user exists
        # Create task with proper relationships
        # Return formatted response
        pass
```

#### Repositories Layer
- Database queries encapsulation
- Query optimization
- Data access methods
- SQL abstraction

```python
class TaskRepository:
    @staticmethod
    def create(db: Session, **kwargs) -> Task:
        task = Task(**kwargs)
        db.add(task)
        db.commit()
        return task
```

#### Models Layer
- ORM entity definitions
- Database schema
- Relationships
- Constraints

```python
class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    # ...
```

### Dependency Injection

FastAPI uses dependency injection for:
- Database sessions
- Current user context
- Configuration values

```python
async def list_tasks(db: Session = Depends(get_db)):
    # db is injected automatically
    pass
```

---

## Frontend Architecture

### Component Hierarchy

```
App (Router)
├── Dashboard Page
│   ├── StatCard
│   ├── TaskOverview
│   └── Chart Component
├── TasksList Page
│   ├── FilterBar
│   ├── Table
│   │   ├── TableHeader
│   │   └── TableBody
│   │       └── TableRow
│   ├── Pagination
│   └── LoadingSpinner
├── TaskDetail Page
│   ├── TaskHeader
│   ├── DescriptionSection
│   ├── CommentsSection
│   │   └── CommentItem
│   └── PropertiesPanel
├── CreateTask Page
│   └── TaskForm
├── Users Page
│   └── UserCard
└── Navigation
    ├── Sidebar
    └── TopBar
```

### State Management Strategy

**Local Component State** (for form data, UI toggles):
```jsx
const [formData, setFormData] = useState({...})
const [isLoading, setIsLoading] = useState(false)
```

**Lifted State** (shared between siblings):
```jsx
// In parent component
const [filters, setFilters] = useState({...})
<FilterComponent filters={filters} onChange={setFilters} />
<TaskList filters={filters} />
```

**API Response Caching**:
```jsx
useEffect(() => {
  // Fetch only when dependencies change
}, [page, filters])
```

### Service Layer Pattern

The `api.js` service file abstracts all HTTP communication:

```javascript
// All API calls go through service
export const TaskAPI = {
  listTasks: (params) => apiClient.get('/tasks', { params }),
  getTask: (id) => apiClient.get(`/tasks/${id}`),
  createTask: (data) => apiClient.post('/tasks', data),
  updateTask: (id, data) => apiClient.put(`/tasks/${id}`, data),
  deleteTask: (id) => apiClient.delete(`/tasks/${id}`)
}

// Component uses service
async function handleCreate(data) {
  try {
    await TaskAPI.createTask(data)
  } catch (error) {
    // Handle error
  }
}
```

---

## Data Flow

### Create Task Flow

```
User fills form in CreateTask
        ↓
Form validation (client-side)
        ↓
TaskAPI.createTask(payload)
        ↓
HTTP POST /api/tasks
        ↓
routes/tasks.py (create_task endpoint)
        ↓
services/task_service.py (create_task method)
        ↓
repositories/task_repository.py (create method)
        ↓
Task model → Database
        ↓
Response returned
        ↓
Navigate to task details
        ↓
UI updates with new task
```

### List Tasks with Filters Flow

```
User adjusts filters
        ↓
setFilters(...) updates state
        ↓
useEffect triggers with new dependencies
        ↓
TaskAPI.listTasks({filters, page, pageSize})
        ↓
HTTP GET /api/tasks?status=...&priority=...&page=...
        ↓
routes/tasks.py (list_tasks endpoint)
        ↓
services/task_service.py (list_tasks method)
        ↓
repositories/task_repository.py (list_tasks method)
        ↓
Database query with WHERE and LIMIT/OFFSET
        ↓
Results + pagination info returned
        ↓
setTasks(results) updates state
        ↓
Component re-renders with filtered tasks
```

---

## Design Patterns

### 1. Repository Pattern

**Purpose:** Abstract data access logic

**Implementation:**
```python
class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: int):
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def create(db: Session, name: str, email: str):
        user = User(name=name, email=email)
        db.add(user)
        db.commit()
        return user
```

**Benefits:**
- Centralized data access
- Easy to test (can mock repository)
- Consistent query patterns
- Easier database changes

### 2. Service Layer Pattern

**Purpose:** Business logic encapsulation

**Implementation:**
```python
class TaskService:
    @staticmethod
    def create_task(db, task_data, created_by):
        # Validate user exists
        user = UserRepository.get_by_id(db, task_data.assigned_to)
        if not user:
            raise ValueError("User not found")
        
        # Create task
        return TaskRepository.create(db, ...)
```

**Benefits:**
- Business logic separate from API
- Reusable across endpoints
- Easier to test

### 3. Dependency Injection Pattern

**Backend:**
```python
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Dependencies injected automatically
    pass
```

**Benefits:**
- Loose coupling
- Easy to test (can inject mocks)
- Cleaner code

### 4. Schema Validation Pattern (Pydantic)

**Purpose:** Input/output validation

**Implementation:**
```python
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    priority: TaskPriorityEnum = TaskPriorityEnum.MEDIUM
    due_date: Optional[datetime] = None
    
    @validator("title")
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()
```

**Benefits:**
- Automatic validation
- Type safety
- Clear API contracts
- Good error messages

### 5. Middleware Pattern

**Purpose:** Cross-cutting concerns

**Implementation:**
```python
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request.state.id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.id
    return response
```

**Benefits:**
- Centralized handling
- Applies to all routes
- Clean separation

### 6. Component Composition Pattern (React)

**Purpose:** Reusable UI components

**Implementation:**
```jsx
// Base component
<Button variant="primary" size="lg">Create</Button>

// Composed
<Modal title="Create Task">
  <Input label="Title" />
  <Select label="Priority" options={[...]} />
  <Button variant="primary">Save</Button>
</Modal>
```

**Benefits:**
- Code reuse
- Consistent UI
- Easy theming
- Maintainable

---

## Database Design

### Schema Overview

```sql
Users
├── id (PK)
├── name
├── email (UNIQUE)
├── role
└── timestamps

Tasks
├── id (PK)
├── title
├── description
├── status (ENUM)
├── priority (ENUM)
├── assigned_to (FK → Users)
├── created_by (FK → Users)
├── due_date
└── timestamps

Comments
├── id (PK)
├── task_id (FK → Tasks)
├── user_id (FK → Users)
├── comment (TEXT)
└── timestamps
```

### Indexes for Performance

```python
# In Task model
__table_args__ = (
    Index("idx_task_status_priority", "status", "priority"),
    Index("idx_task_assigned_to_status", "assigned_to", "status"),
    Index("idx_task_due_date", "due_date"),
)
```

### Relationships

**One-to-Many (User → Tasks):**
```python
assigned_user = relationship("User", back_populates="tasks_assigned")
```

**One-to-Many (Task → Comments):**
```python
comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
```

---

## API Design

### RESTful Principles

**Resources as URLs:**
- `/api/tasks` - Collection
- `/api/tasks/1` - Specific resource

**HTTP Methods:**
- `GET` - Read
- `POST` - Create
- `PUT` - Update
- `DELETE` - Delete

**Status Codes:**
- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

### Response Format

**Consistent structure:**
```json
{
  "status": "success",
  "data": {...},
  "pagination": {...},
  "timestamp": "2024-01-20T15:30:00"
}
```

### Pagination

**Request:**
```
GET /api/tasks?page=1&page_size=20
```

**Response:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5,
  "has_next": true
}
```

---

## Security Architecture

### Authentication

**Current:** Mock-based (for demo)

**Recommended:** JWT Tokens

```python
from jose import JWTError, jwt
from datetime import datetime, timedelta

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Authorization

**Role-Based Access Control (RBAC):**
```python
def require_role(required_role: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: int, current_user = Depends(require_role("admin"))):
    # Only admins can delete
    pass
```

### Input Validation

- Pydantic schemas validate input
- Type hints provide safety
- SQL injection prevented by ORM
- XSS prevention through proper escaping

### CORS

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend.example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### HTTPS/TLS

- Always use HTTPS in production
- Set `Secure` and `HttpOnly` flags on cookies
- Use HSTS headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Performance Considerations

### Backend Optimization

1. **Database Indexing**
   - Index frequently queried columns
   - Composite indexes for filter combinations

2. **Query Optimization**
   - Eager loading with relationships
   - Pagination for large datasets
   - Query result caching

3. **Connection Pooling**
   - Reuse database connections
   - Configured in SQLAlchemy

4. **Async Operations**
   - Use `httpx.AsyncClient` for external APIs
   - Non-blocking database operations

### Frontend Optimization

1. **Code Splitting**
   - Route-based splitting
   - Component lazy loading

2. **Caching**
   - HTTP cache headers
   - LocalStorage for user preferences

3. **Rendering**
   - Prevent unnecessary re-renders
   - Virtual scrolling for large lists

4. **Bundle Size**
   - Tree-shaking
   - Minification
   - CDN distribution

---

## Scalability

### Horizontal Scaling

**Backend:**
- Multiple API instances behind load balancer
- Stateless design (no server sessions)
- Shared database

**Frontend:**
- Static files on CDN
- Multi-region deployment

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Implement caching layers

### Caching Strategy

```python
# Redis caching
from redis import Redis
cache = Redis()

# Cache dashboard stats (5 minute TTL)
cache.setex("dashboard:stats", 300, json.dumps(stats))
```

---

## Monitoring & Observability

### Application Metrics

```python
from prometheus_client import Counter, Histogram

requests_total = Counter('requests_total', 'Total requests')
request_duration = Histogram('request_duration_seconds', 'Request duration')
```

### Logging

```python
import logging
logger = logging.getLogger(__name__)
logger.info(f"Task {task_id} created by user {user_id}")
```

### Health Checks

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}
```

---

## Conclusion

This architecture provides:
- **Maintainability:** Clear separation of concerns
- **Testability:** Dependency injection and repositories
- **Scalability:** Stateless design and caching
- **Security:** Validation and authorization
- **Performance:** Optimization strategies
- **Reliability:** Error handling and monitoring

The design patterns and principles used ensure the application can grow and adapt to new requirements while maintaining code quality and system reliability.
