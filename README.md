# TaskHub Agile & Task Management Platform

A **production-ready, Jira-grade Agile Task Management Platform** powered by **FastAPI**, **React 18**, **PostgreSQL/SQLite**, and ultra-fast **Groq AI**.

Designed with modern Atlassian-inspired UI/UX, full Agile lifecycle support (Roadmap, Sprints, Backlog, Kanban Board), senior-level Role-Based Access Control (RBAC), and embedded Groq LPU inference for automated issue prioritization and effort estimation.

---

## 🌟 Key Features

### 1. 🚀 Jira-Style Agile Suite
- **Issue Types & Keys**: First-class support for `Story` (📗), `Bug` (🔴), `Task` (🟦), and `Epic` (🟪) with auto-formatted project keys (`PROJ-1`, `PROJ-2`).
- **Interactive Kanban Board (`/kanban`)**:
  - Drag-and-drop workflow across `TO DO`, `IN PROGRESS`, `BLOCKED`, and `DONE`.
  - Quick filters: *Only My Issues*, *Stories*, *Bugs*, *Tasks*, *Epics*, and search.
  - Column story point summaries & work-in-progress counters.
  - Quick inline card creation directly at the bottom of each column.
- **Sprint Planning & Backlog (`/backlog`)**:
  - Active Sprint container with completion actions and total story point counters.
  - Backlog backlog queue with one-click transfer between Active Sprint and Backlog.
  - Quick issue creator inline in Sprints or Backlog.
- **Roadmap & Epics Timeline (`/roadmap`)**:
  - Strategic initiatives tracking across core epics (*Security & Auth*, *User Experience*, *DevOps*, *Platform*).
  - Visual completion percentage progress bars.
- **Slide-Out Issue Detail Drawer**:
  - Right-side slide-out inspector for editing title, description, status, assignee, story points, priority, sprint, and epic inline without leaving the board.
  - Tabbed activity feed: Comments with rich avatars & audit trail.

---

### 2. ⚡ Ultra-Fast Groq AI Integration
- **Embedded Inline AI Autofill**:
  - Built directly into the **Issue Summary** toolbar (`✨ AI Autofill`).
  - Automatically analyzes task title and context to populate **Priority**, **Fibonacci Story Points** (`1, 2, 3, 5, 8, 13`), and **Issue Type** in milliseconds.
- **AI Acceptance Criteria Enhancer**:
  - Embedded directly on the **Description** header (`✨ AI Enhance Description`).
  - Generates structured objectives and bulleted acceptance criteria directly into the textarea.
- **Multi-Model Resilience**:
  - Powered by Groq's high-speed LPU inference engine (`groq/compound-mini`, `openai/gpt-oss-20b`, `groq/compound`).
  - Ultra-fast response times: typically under 150ms.

---

### 3. 🛡️ Senior-Level Role-Based Access Control (RBAC)
- **Admin**: Full platform management, user administration, task creation, updates, and deletion.
- **Manager**: Team sprint planning, backlog management, task assignment, status updates, and user oversight.
- **Developer**: Active sprint execution, task creation, Kanban moves, status transitions, and self-assignment.
- **Analyst**: Read-only access across all dashboards, roadmaps, and analytics.

---

### 4. 🎨 Sky Blue & White Modern Design System
- Pure crisp white surfaces (`#ffffff`) paired with fresh sky-blue accents (`#0284c7`, `#38bdf8`, `#e0f2fe`).
- Deep sky ocean sidebar gradient with single distinct active tab selection and glowing state indicators.
- Seamless Dark Mode toggle with automatic contrast adaptation.
- Real-time notification center and toast stack.

---

## 🛠 Tech Stack

### Frontend
- **React 18** (Vite build tool)
- **Tailwind CSS & Vanilla CSS Variables** (Sky Blue & White theme)
- **React Router v6** (with v7 future flags enabled)
- **Axios** (JWT interceptors & auto-refresh queue)

### Backend
- **FastAPI** (Python 3.11+ async REST API)
- **SQLAlchemy 2.0 ORM** (SQLite for development / PostgreSQL for production)
- **Groq SDK** (Ultra-fast AI task analysis)
- **Pydantic v2 & Pydantic Settings**
- **Passlib & Python-Jose** (bcrypt password hashing & JWT security)
- **Uvicorn** (ASGI server)

---

## 📁 Directory Structure

```
task-management-dashboard/
├── backend/
│   ├── config.py                 # Pydantic Settings & environment config
│   ├── main.py                   # FastAPI app entry point & route registration
│   ├── requirements.txt          # Python backend dependencies
│   ├── database/
│   │   ├── connection.py         # DB engine, session lifecycle & seed data
│   │   └── models.py             # SQLAlchemy models (User, Task, Comment, Activity)
│   ├── routes/
│   │   ├── auth.py               # Login, refresh token, user me
│   │   ├── tasks.py              # Jira CRUD, sprint updates, filters
│   │   ├── groq_ai.py            # AI endpoints (analyze, priority, effort)
│   │   ├── dashboard.py          # Role-based analytics & stats
│   │   ├── comments.py           # Task comments
│   │   ├── users.py              # User management & RBAC
│   │   └── activity.py           # Audit history logs
│   ├── services/
│   │   ├── groq_ai_service.py    # Groq LPU inference client
│   │   ├── task_service.py       # Task business logic & audit logging
│   │   └── user_service.py       # User authentication & management
│   └── utils/
│       └── auth.py               # JWT verification & RBAC decorators
│
├── frontend/
│   ├── package.json              # NPM dependencies & scripts
│   ├── src/
│   │   ├── App.jsx               # Navigation, layout & routing
│   │   ├── App.css               # Sky Blue & White theme design system
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Analytics & Role Workspace
│   │   │   ├── KanbanView.jsx    # Active Sprint Kanban Board
│   │   │   ├── Backlog.jsx       # Sprint Planning & Backlog
│   │   │   ├── Roadmap.jsx       # Epics Roadmap Timeline
│   │   │   ├── TasksList.jsx     # All Issues Table & Filters
│   │   │   ├── CreateTask.jsx    # Issue Creator with Embedded AI
│   │   │   ├── TaskDetail.jsx    # Full Page Issue View
│   │   │   ├── Users.jsx         # Team Management
│   │   │   └── Login.jsx         # Secure Sky Blue Sign In
│   │   ├── components/
│   │   │   ├── JiraIcons.jsx     # Issue Type & Priority SVG Icons
│   │   │   ├── TaskCard.jsx      # Jira-style Kanban card
│   │   │   ├── KanbanBoard.jsx   # Agile board with quick filters
│   │   │   ├── CreateIssueModal.jsx # Global + Create issue modal
│   │   │   └── IssueDetailDrawer.jsx # Slide-out inspector
│   │   └── services/
│   │       ├── api.js            # Axios client with JWT interceptors
│   │       └── groqAIService.js  # Frontend Groq AI client
```

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run backend server
uvicorn main:app --reload --port 8000
```
Backend API will be live at: `http://localhost:8000`  
Interactive Swagger Docs at: `http://localhost:8000/docs`

---

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`

---

## 🔑 Groq AI Configuration

To enable ultra-fast AI suggestions:
1. Obtain a free API key from [Groq Console](https://console.groq.com).
2. Add your key to `backend/.env`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=groq/compound-mini
AI_ENABLED=true
```
3. Restart the backend — AI autofill will immediately activate inside the Issue Summary & Description fields.

---

## 📜 API Documentation

Complete API documentation is available in [API_DOCUMENTATION.md](file:///d:/task-management-dashboard/task-management-dashboard/API_DOCUMENTATION.md) and interactively at `/docs`.
