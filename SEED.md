# TaskHub Database Seed & Demo Accounts Reference

This document details all pre-seeded users, credentials, role permissions, and sample Jira issues automatically provisioned on application startup.

---

## 👥 Seed User Accounts

All pre-seeded user accounts share the same default password:

```
Default Password: password123
```

| Name | Email Address | Role | Workspace Permissions |
|---|---|---|---|
| **Alice Johnson** | `alice@company.com` | `admin` | Full system administration, user management, task deletion, board & sprint planning |
| **Bob Smith** | `bob@company.com` | `manager` | Team management, sprint & backlog management, task assignment, status updates |
| **Charlie Davis** | `charlie@company.com` | `developer` | Sprint execution, issue creation, status transitions, self-assignment, task editing |
| **Diana Wilson** | `diana@company.com` | `developer` | Sprint execution, issue creation, status transitions, self-assignment, task editing |
| **Eve Martinez** | `eve@company.com` | `analyst` | Read-only access across all dashboards, roadmaps, sprint metrics, and audit logs |

---

## 📋 Pre-Seeded Sample Issues & Epics

The application seeds 15 realistic software engineering issues distributed across Sprints, Backlog, Epics, and Kanban columns:

### Active Sprint (`Sprint 1`)
| Key | Summary | Issue Type | Story Points | Priority | Status | Assignee | Epic |
|---|---|---|---|---|---|---|---|
| `PROJ-1` | Implement user authentication with JWT & RBAC | 📗 Story | 5 pts | ⬆ High | In Progress | Charlie Davis | Security & Auth |
| `PROJ-2` | Design modern Atlassian-style onboarding flow | 📗 Story | 3 pts | 🟡 Medium | To Do | Diana Wilson | User Experience |
| `PROJ-3` | Critical fix: memory leak in WebSocket stream | 🔴 Bug | 8 pts | 🔴 Urgent | Blocked | Charlie Davis | DevOps & Infrastructure |
| `PROJ-4` | Optimize PostgreSQL database queries with indexes | 🟦 Task | 3 pts | ⬆ High | Done | Alice Johnson | DevOps & Infrastructure |
| `PROJ-5` | Automated end-to-end integration tests | 🟦 Task | 5 pts | 🟡 Medium | In Progress | Diana Wilson | Developer Platform |
| `PROJ-6` | Real-time WebSocket collaboration engine | 🟪 Epic | 13 pts | ⬆ High | In Progress | Bob Smith | Real-time Collaboration |
| `PROJ-7` | Export tasks and sprint metrics to CSV/Excel | 📗 Story | 2 pts | ⬇ Low | To Do | Charlie Davis | Developer Platform |
| `PROJ-8` | Security audit & OWASP vulnerability remediation | 🟦 Task | 5 pts | 🔴 Urgent | To Do | Alice Johnson | Security & Auth |

---

### Backlog & Future Sprints (`Sprint 2` / `Backlog`)
| Key | Summary | Issue Type | Story Points | Priority | Status | Assignee | Epic |
|---|---|---|---|---|---|---|---|
| `PROJ-9` | Fix dropdown z-index collision on mobile viewports | 🔴 Bug | 2 pts | 🟡 Medium | To Do | Diana Wilson | User Experience |
| `PROJ-10` | Implement dark mode contrast theme toggle | 📗 Story | 3 pts | ⬇ Low | To Do | Charlie Davis | User Experience |
| `PROJ-11` | Docker compose multi-container orchestration | 🟦 Task | 5 pts | ⬆ High | To Do | Bob Smith | DevOps & Infrastructure |
| `PROJ-12` | Redis cache layer for high-throughput dashboard analytics | 📗 Story | 5 pts | 🟡 Medium | To Do | Unassigned | DevOps & Infrastructure |
| `PROJ-13` | Slack notification webhook integration for sprint events | 📗 Story | 3 pts | ⬇ Low | To Do | Unassigned | Developer Platform |
| `PROJ-14` | Microservices migration blueprint architecture | 🟪 Epic | 13 pts | ⬆ High | To Do | Alice Johnson | DevOps & Infrastructure |
| `PROJ-15` | Sentry real-time exception tracking & alerting | 🟦 Task | 2 pts | 🟡 Medium | To Do | Diana Wilson | Developer Platform |

---

## 🗄️ Database Tables Structure

```
task_management.db (SQLite / PostgreSQL)
├── users
│   ├── id (INTEGER, PRIMARY KEY)
│   ├── name (VARCHAR)
│   ├── email (VARCHAR, UNIQUE)
│   ├── role (VARCHAR: admin | manager | developer | analyst)
│   ├── password_hash (VARCHAR)
│   └── created_at (DATETIME)
│
├── tasks
│   ├── id (INTEGER, PRIMARY KEY)
│   ├── title (VARCHAR)
│   ├── description (TEXT)
│   ├── issue_type (VARCHAR: story | task | bug | epic)
│   ├── story_points (INTEGER: 1, 2, 3, 5, 8, 13)
│   ├── epic_name (VARCHAR)
│   ├── sprint (VARCHAR: Sprint 1 | Sprint 2 | Backlog)
│   ├── status (VARCHAR: pending | in_progress | completed | blocked)
│   ├── priority (VARCHAR: low | medium | high | urgent)
│   ├── assigned_to (INTEGER, FK -> users.id)
│   ├── created_by (INTEGER, FK -> users.id)
│   ├── due_date (DATETIME)
│   ├── created_at (DATETIME)
│   └── updated_at (DATETIME)
│
├── comments
│   ├── id (INTEGER, PRIMARY KEY)
│   ├── task_id (INTEGER, FK -> tasks.id)
│   ├── user_id (INTEGER, FK -> users.id)
│   ├── comment (TEXT)
│   ├── created_at (DATETIME)
│   └── updated_at (DATETIME)
│
└── activity_logs
    ├── id (INTEGER, PRIMARY KEY)
    ├── task_id (INTEGER, FK -> tasks.id)
    ├── user_id (INTEGER, FK -> users.id)
    ├── action (VARCHAR)
    ├── field_name (VARCHAR)
    ├── old_value (VARCHAR)
    ├── new_value (VARCHAR)
    └── created_at (DATETIME)
```

---

## 🔄 How to Reset / Re-Seed Database

### Automatic Auto-Seed on Startup
The backend automatically creates all tables and seeds default users and issues whenever the database is empty or initialized for the first time.

### To Freshly Reset the Database
```bash
# In the backend directory:
# 1. Stop the backend server
# 2. Delete the SQLite database file
rm backend/task_management.db

# 3. Start the backend server — it will automatically recreate and seed the database
uvicorn main:app --reload
```
