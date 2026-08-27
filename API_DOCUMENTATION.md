# API Documentation

## Overview

The Task Management Dashboard API is a RESTful API built with FastAPI. It provides endpoints for managing tasks, users, and team collaboration.

**Base URL:** `http://localhost:8000/api`

**API Version:** 1.0.0

**Response Format:** JSON

## Authentication

Currently, the API uses a mock authentication system. In production, implement JWT-based authentication:

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthCredential

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthCredential = Depends(security)):
    # Validate JWT token
    pass
```

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "status": "error",
  "detail": "Error message describing what went wrong"
}
```

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful with no content
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service down

## Rate Limiting

Current implementation has no rate limiting. For production, implement:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/tasks")
@limiter.limit("100/minute")
async def list_tasks(request: Request):
    pass
```

---

## Task Endpoints

### List Tasks

**Endpoint:** `GET /api/tasks`

**Description:** Retrieve paginated list of tasks with advanced filtering

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| page_size | integer | 20 | Items per page (max: 100) |
| status | string | - | Filter by status |
| priority | string | - | Filter by priority |
| assignee | integer | - | Filter by assignee user ID |
| search | string | - | Search in title and description |
| sort_by | string | updated_at | Sort field |
| sort_order | string | desc | Sort order (asc/desc) |

**Status Values:** `pending`, `in_progress`, `completed`, `blocked`

**Priority Values:** `low`, `medium`, `high`, `urgent`

**Example Request:**
```bash
curl "http://localhost:8000/api/tasks?status=in_progress&priority=high&page=1&page_size=20"
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Implement authentication",
      "status": "in_progress",
      "priority": "high",
      "assigned_user": {
        "id": 1,
        "name": "Alice Johnson",
        "email": "alice@company.com",
        "role": "admin"
      },
      "due_date": "2024-12-31T23:59:59",
      "created_at": "2024-01-15T10:00:00",
      "updated_at": "2024-01-20T14:30:00"
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "total_pages": 3,
  "has_next": true,
  "has_previous": false
}
```

---

### Get Task Details

**Endpoint:** `GET /api/tasks/{task_id}`

**Description:** Retrieve detailed information about a specific task

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| task_id | integer | Task ID |

**Example Request:**
```bash
curl http://localhost:8000/api/tasks/1
```

**Response:**
```json
{
  "id": 1,
  "title": "Implement authentication",
  "description": "Add JWT-based authentication to the API",
  "status": "in_progress",
  "priority": "high",
  "assigned_user": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@company.com",
    "role": "admin"
  },
  "creator": {
    "id": 2,
    "name": "Bob Smith",
    "email": "bob@company.com",
    "role": "manager"
  },
  "comments": [
    {
      "id": 1,
      "comment": "Please prioritize this task",
      "author": {
        "id": 2,
        "name": "Bob Smith",
        "email": "bob@company.com"
      },
      "created_at": "2024-01-20T14:00:00",
      "updated_at": "2024-01-20T14:00:00"
    }
  ],
  "due_date": "2024-12-31T23:59:59",
  "created_at": "2024-01-15T10:00:00",
  "updated_at": "2024-01-20T14:30:00"
}
```

---

### Create Task

**Endpoint:** `POST /api/tasks`

**Description:** Create a new task

**Request Body:**
```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication to the API",
  "assigned_to": 1,
  "priority": "high",
  "due_date": "2024-12-31T23:59:59"
}
```

**Required Fields:**
- `title` (string, 1-255 characters)

**Optional Fields:**
- `description` (string, max 5000 characters)
- `assigned_to` (integer - user ID)
- `priority` (string - default: "medium")
- `due_date` (datetime)

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "priority": "high",
    "assigned_to": 1
  }'
```

**Response:**
```json
{
  "status": "success",
  "id": 42,
  "title": "Implement user authentication",
  "status": "pending",
  "priority": "high",
  "message": "Task created successfully"
}
```

---

### Update Task

**Endpoint:** `PUT /api/tasks/{task_id}`

**Description:** Update an existing task

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| task_id | integer | Task ID |

**Request Body:** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "completed",
  "priority": "urgent",
  "assigned_to": 2,
  "due_date": "2024-12-31T23:59:59"
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "priority": "urgent"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "title": "Updated title",
    "status": "completed",
    "priority": "urgent",
    ...
  }
}
```

---

### Delete Task

**Endpoint:** `DELETE /api/tasks/{task_id}`

**Description:** Delete a task

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| task_id | integer | Task ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:8000/api/tasks/1
```

**Response:** `204 No Content`

---

## User Endpoints

### List Users

**Endpoint:** `GET /api/users`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | integer | 0 | Number of records to skip |
| limit | integer | 100 | Number of records to return |

**Response:**
```json
[
  {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@company.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

---

### Get User

**Endpoint:** `GET /api/users/{user_id}`

**Response:**
```json
{
  "id": 1,
  "name": "Alice Johnson",
  "email": "alice@company.com",
  "role": "admin",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

---

### Create User

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "role": "developer"
}
```

**Role Values:** `admin`, `manager`, `developer`, `analyst`

---

### Delete User

**Endpoint:** `DELETE /api/users/{user_id}`

**Description:** Soft delete user (marks as inactive)

---

## Dashboard Endpoints

### Get Dashboard Statistics

**Endpoint:** `GET /api/dashboard`

**Response:**
```json
{
  "status": "success",
  "timestamp": "2024-01-20T15:30:00",
  "tasks": {
    "total": 42,
    "pending": 10,
    "in_progress": 15,
    "completed": 15,
    "blocked": 2,
    "overdue": 1,
    "completion_rate": 35.71
  },
  "priority_distribution": {
    "low": 8,
    "medium": 18,
    "high": 12,
    "urgent": 4
  },
  "current_user": {
    "id": 1,
    "assigned_total": 5,
    "pending": 2,
    "in_progress": 3,
    "overdue_assigned": 0
  },
  "team": {
    "total_users": 5,
    "active_contributors": 4
  },
  "trends": {
    "tasks_created_today": 2,
    "tasks_completed_today": 1
  }
}
```

---

### Get Overdue Tasks

**Endpoint:** `GET /api/dashboard/tasks/overdue`

**Response:**
```json
{
  "status": "success",
  "total": 1,
  "tasks": [
    {
      "id": 1,
      "title": "Fix critical bug",
      "priority": "urgent",
      "assigned_user": {
        "id": 2,
        "name": "Bob Smith",
        "email": "bob@company.com"
      },
      "due_date": "2024-01-10T17:00:00",
      "days_overdue": 10
    }
  ]
}
```

---

### Get Upcoming Tasks

**Endpoint:** `GET /api/dashboard/tasks/upcoming`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | integer | 7 | Days range to look ahead |

---

## Comments Endpoints

### Add Comment

**Endpoint:** `POST /api/comments/tasks/{task_id}`

**Request Body:**
```json
{
  "comment": "This needs to be reviewed before deployment"
}
```

---

### Get Comments

**Endpoint:** `GET /api/comments/tasks/{task_id}`

---

### Delete Comment

**Endpoint:** `DELETE /api/comments/{comment_id}`

---

## External API Endpoints

### Get GitHub User

**Endpoint:** `GET /api/external/github/users/{username}`

**Example:**
```bash
curl http://localhost:8000/api/external/github/users/anthropics
```

---

### Get GitHub Repository

**Endpoint:** `GET /api/external/github/repos/{owner}/{repo}`

**Example:**
```bash
curl http://localhost:8000/api/external/github/repos/anthropics/anthropic-sdk-python
```

---

### Get Weather

**Endpoint:** `GET /api/external/weather/{city}`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| country | string | Country code (optional) |

**Example:**
```bash
curl http://localhost:8000/api/external/weather/London?country=UK
```

---

## Error Handling

### Common Error Responses

**404 Not Found:**
```json
{
  "detail": "Task 999 not found"
}
```

**400 Bad Request:**
```json
{
  "detail": "Invalid input: title cannot be empty"
}
```

**422 Validation Error:**
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "ensure this value has at most 255 characters",
      "type": "value_error.string.max_length"
    }
  ]
}
```

---

## Pagination

All list endpoints support pagination:

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5,
  "has_next": true,
  "has_previous": false
}
```

**Calculate total pages:**
```
total_pages = ceil(total / page_size)
```

---

## Interactive API Documentation

Visit `http://localhost:8000/docs` for interactive Swagger UI documentation.

Visit `http://localhost:8000/redoc` for ReDoc documentation.

---

## Example Workflows

### Complete a Task

1. Get task: `GET /api/tasks/1`
2. Update status: `PUT /api/tasks/1` with `{"status": "completed"}`
3. Add final comment: `POST /api/comments/tasks/1`

### Assign Task to Team Member

1. List users: `GET /api/users`
2. Update task: `PUT /api/tasks/1` with `{"assigned_to": 2}`

### Get Team Workload

1. Get dashboard stats: `GET /api/dashboard`
2. For each user, get assigned tasks: `GET /api/tasks?assignee={user_id}`
