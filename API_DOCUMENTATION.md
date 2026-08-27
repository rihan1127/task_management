# TaskHub API Documentation

TaskHub provides a comprehensive RESTful API built on **FastAPI** with JWT authentication, role-based authorization, and ultra-fast **Groq AI** endpoints.

- **Base URL**: `http://localhost:8000/api`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **OpenAPI JSON Spec**: `http://localhost:8000/openapi.json`

---

## 🔐 Authentication & Authorization

All protected endpoints require an `Authorization` header containing a valid Bearer JWT:
```http
Authorization: Bearer <access_token>
```

### Roles & Permissions Matrix
| Endpoint Group | Admin | Manager | Developer | Analyst |
|---|---|---|---|---|
| **View Dashboard & Tasks** | ✅ Full | ✅ Full | ✅ Full | ✅ Read-Only |
| **Create Issue** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Forbidden |
| **Update Issue / Sprint** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Forbidden |
| **Delete Issue** | ✅ Yes | ✅ Yes | ❌ Forbidden | ❌ Forbidden |
| **Manage Users** | ✅ Yes | ✅ Yes | ❌ Forbidden | ❌ Forbidden |
| **Groq AI Features** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/login`
Authenticate a user and retrieve access + refresh tokens.

**Request Body:**
```json
{
  "email": "alice@company.com",
  "password": "password123"
}
```

**Response (`200 OK`):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@company.com",
    "role": "admin"
  }
}
```

---

### `POST /api/auth/refresh`
Obtain a new access token using a valid refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### `GET /api/auth/me`
Retrieve the currently authenticated user's profile and permissions.

---

## 2. Jira Tasks & Issues (`/api/tasks`)

### `GET /api/tasks`
List issues with advanced filtering, sorting, and pagination.

**Query Parameters:**
- `page` (integer, default: `1`)
- `page_size` (integer, default: `20`)
- `status` (string: `pending`, `in_progress`, `completed`, `blocked`)
- `priority` (string: `low`, `medium`, `high`, `urgent`)
- `issue_type` (string: `story`, `task`, `bug`, `epic`)
- `sprint` (string: `Sprint 1`, `Backlog`, `Sprint 2`)
- `assignee` (integer user ID)
- `search` (string text search in title & description)
- `sort_by` (string: `updated_at`, `created_at`, `priority`)
- `sort_order` (string: `asc`, `desc`)

---

### `POST /api/tasks`
Create a new Jira issue.

**Request Body:**
```json
{
  "title": "Implement OAuth2 social login",
  "description": "Support Google and GitHub authentication providers",
  "issue_type": "story",
  "story_points": 5,
  "epic_name": "Security & Auth",
  "sprint": "Sprint 1",
  "priority": "high",
  "assigned_to": 2,
  "due_date": "2026-09-15T00:00:00"
}
```

---

### `GET /api/tasks/{task_id}`
Get full details of an issue including assigned user, creator, comments, and audit history.

---

### `PUT /api/tasks/{task_id}`
Update issue attributes, move between Sprints & Backlog, change status, or reassign.

**Request Body (Partial updates supported):**
```json
{
  "status": "in_progress",
  "sprint": "Sprint 1",
  "story_points": 8
}
```

---

### `DELETE /api/tasks/{task_id}`
Delete an issue. *(Restricted to `admin` and `manager`)*

---

## 3. ⚡ Groq AI Endpoints (`/api/ai`)

Ultra-fast AI analysis powered by Groq's high-speed LPU inference engine (< 150ms).

### `POST /api/ai/analyze`
Complete AI analysis: priority suggestion, task categorization, and story points in a single request.

**Request Body:**
```json
{
  "title": "Fix memory leak in background worker pool",
  "description": "Workers crash after processing 10,000 requests"
}
```

**Response (`200 OK`):**
```json
{
  "status": "success",
  "provider": "groq",
  "model": "groq/compound-mini",
  "priority": {
    "suggested_priority": "urgent",
    "confidence": 0.94,
    "reasoning": "Memory leaks cause process termination and impact background jobs."
  },
  "category": {
    "category": "bug",
    "confidence": 0.96,
    "reasoning": "Worker crashing due to leak is a defect."
  },
  "story_points": {
    "estimated_points": 5,
    "confidence": 0.85,
    "reasoning": "Diagnosing memory leaks requires profiling and leak fix verification."
  }
}
```

---

### `POST /api/ai/suggest-priority`
Suggest task priority level (`low`, `medium`, `high`, `urgent`) with confidence score.

---

### `POST /api/ai/categorize`
Classify task into standard categories (`bug`, `feature`, `improvement`, `documentation`, `refactor`, `test`, `deployment`, `security`).

---

### `POST /api/ai/estimate-effort`
Estimate Fibonacci story points (`1`, `2`, `3`, `5`, `8`, `13`) based on task complexity.

---

### `POST /api/ai/enhance-description`
Generate structured objectives, technical context, and bulleted acceptance criteria for an issue.

**Request Body:**
```json
{
  "title": "Add export to CSV for task reports",
  "description": "Users need to download table data"
}
```

**Response (`200 OK`):**
```json
{
  "status": "success",
  "enhanced_description": "Objective:\nEnable users to export filtered task lists to CSV format.\n\nAcceptance Criteria:\n- Add 'Export CSV' button on tasks list toolbar\n- Include columns: Key, Title, Type, Status, Priority, Assignee, Points\n- Respect current active filters in the exported file\n- Sanitize output to prevent CSV formula injection"
}
```

---

## 4. Dashboard & Analytics (`/api/dashboard`)

### `GET /api/dashboard/stats`
Retrieve aggregated system metrics, completion rates, priority distributions, and trends.

### `GET /api/dashboard/overdue`
Retrieve list of overdue tasks.

### `GET /api/dashboard/upcoming`
Retrieve tasks due within the next N days (default: 7 days).

---

## 5. Comments & Activity (`/api/comments`, `/api/activity`)

### `POST /api/comments`
Add a comment to an issue.

### `GET /api/activity/{task_id}`
Retrieve complete audit log of all changes made to an issue over time.

---

## 6. Team & User Management (`/api/users`)

### `GET /api/users`
List all team members with roles and task counts.

### `POST /api/users`
Register a new team member with specified role (`admin`, `manager`, `developer`, `analyst`). *(Admin & Manager only)*
