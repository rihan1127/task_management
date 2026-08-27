# Task Management Dashboard

A **production-ready**, enterprise-grade internal task management and collaboration platform built with modern web technologies. This full-stack application demonstrates professional software engineering practices with clean architecture, comprehensive error handling, and a polished user experience.

## 🎯 Overview

TaskHub is a comprehensive task management system designed for teams to collaborate efficiently. It provides real-time task tracking, advanced filtering, user management, and a modern, responsive interface.

**Key Features:**
- 📊 Executive Dashboard with key metrics and analytics
- ✅ Full CRUD operations for tasks
- 👥 User management and task assignment
- 💬 Comments and notes on tasks
- 🔍 Advanced search and filtering
- 📱 Fully responsive design
- 🎨 Professional UI with Tailwind CSS
- ⚡ Fast and performant API
- 🔌 External API integrations (GitHub, Weather)
- 📊 Comprehensive analytics and reporting

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **date-fns** - Date utilities
- **classnames** - Class name utility

### Backend
- **Python 3.9+** - Programming language
- **FastAPI** - Modern async web framework
- **SQLAlchemy** - ORM for database
- **Pydantic** - Data validation
- **PostgreSQL/SQLite** - Database
- **Uvicorn** - ASGI server
- **httpx** - Async HTTP client

### DevOps & Tools
- npm/yarn - Frontend package management
- pip - Python package management
- Git - Version control

## 📁 Project Structure

```
task-management-dashboard/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration settings
│   ├── requirements.txt         # Python dependencies
│   │
│   ├── database/
│   │   ├── connection.py        # Database connection & setup
│   │   ├── base.py              # SQLAlchemy base
│   │   └── models.py            # ORM models (User, Task, Comment)
│   │
│   ├── schemas/
│   │   ├── task_schema.py       # Pydantic schemas for tasks
│   │   ├── user_schema.py       # User schemas
│   │   └── comment_schema.py    # Comment schemas
│   │
│   ├── repositories/
│   │   ├── task_repository.py   # Task data access layer
│   │   ├── user_repository.py   # User data access layer
│   │   └── comment_repository.py # Comment data access layer
│   │
│   ├── services/
│   │   └── task_service.py      # Business logic for tasks
│   │
│   ├── routes/
│   │   ├── tasks.py             # Task endpoints
│   │   ├── users.py             # User endpoints
│   │   ├── dashboard.py         # Dashboard endpoints
│   │   ├── comments.py          # Comment endpoints
│   │   └── external.py          # External API integrations
│   │
│   ├── middleware/
│   │   └── error_handler.py     # Global exception handling
│   │
│   └── utils/
│       └── logger.py            # Logging configuration
│
├── frontend/
│   ├── package.json             # Node dependencies
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS config
│   ├── postcss.config.js        # PostCSS config
│   ├── index.html              # HTML entry point
│   │
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── App.jsx             # Main app component
│       ├── App.css             # Global styles
│       │
│       ├── components/
│       │   ├── Button.jsx       # Reusable button
│       │   ├── Input.jsx        # Form inputs
│       │   ├── Modal.jsx        # Modal dialog
│       │   ├── Badges.jsx       # Status/Priority badges
│       │   ├── Table.jsx        # Data table
│       │   ├── Pagination.jsx   # Pagination
│       │   ├── StatCard.jsx     # Stat card
│       │   └── index.js         # Component exports
│       │
│       ├── services/
│       │   └── api.js           # API service layer
│       │
│       └── pages/
│           ├── Dashboard.jsx    # Dashboard page
│           └── TasksList.jsx    # Tasks list page
│
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm/yarn
- **Python** 3.9+
- **PostgreSQL** 12+ (or SQLite for development)
- **Git**

### Backend Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Create `.env` file:**
```env
DEBUG=True
DATABASE_URL=sqlite:///./task_management.db
SECRET_KEY=your-secret-key-here
LOG_LEVEL=INFO
GITHUB_API_TOKEN=your-github-token  # Optional
```

4. **Run migrations (if using Alembic):**
```bash
# Database tables are auto-created on startup
```

5. **Start backend server:**
```bash
python main.py
# Or with Uvicorn:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Create `.env.local` (optional):**
```env
VITE_API_URL=http://localhost:8000/api
```

3. **Start development server:**
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

4. **Build for production:**
```bash
npm run build
```

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Task Endpoints

#### List Tasks
```http
GET /api/tasks?page=1&page_size=20&status=pending&priority=high&search=shopify
```

**Response:**
```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "total_pages": 3,
  "has_next": true,
  "has_previous": false
}
```

#### Get Task Details
```http
GET /api/tasks/{id}
```

#### Create Task
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication",
  "assigned_to": 1,
  "priority": "high",
  "due_date": "2024-12-31T23:59:59"
}
```

#### Update Task
```http
PUT /api/tasks/{id}
Content-Type: application/json

{
  "status": "in_progress",
  "priority": "urgent"
}
```

#### Delete Task
```http
DELETE /api/tasks/{id}
```

### User Endpoints

#### List Users
```http
GET /api/users
```

#### Get User
```http
GET /api/users/{id}
```

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@company.com",
  "role": "developer"
}
```

### Dashboard Endpoints

#### Get Statistics
```http
GET /api/dashboard
```

**Response:**
```json
{
  "status": "success",
  "tasks": {
    "total": 42,
    "pending": 10,
    "in_progress": 15,
    "completed": 15,
    "blocked": 2,
    "overdue": 1,
    "completion_rate": 35.71
  },
  "priority_distribution": {...},
  "current_user": {...},
  "team": {...},
  "trends": {...}
}
```

#### Overdue Tasks
```http
GET /api/dashboard/tasks/overdue
```

#### Upcoming Tasks
```http
GET /api/dashboard/tasks/upcoming?days=7
```

### Comments Endpoints

#### Add Comment
```http
POST /api/comments/tasks/{task_id}
Content-Type: application/json

{
  "comment": "This task needs clarification"
}
```

#### Get Comments
```http
GET /api/comments/tasks/{task_id}
```

#### Delete Comment
```http
DELETE /api/comments/{comment_id}
```

### External API Endpoints

#### GitHub User Info
```http
GET /api/external/github/users/{username}
```

#### GitHub Repository Info
```http
GET /api/external/github/repos/{owner}/{repo}
```

#### Weather Information
```http
GET /api/external/weather/{city}?country=UK
```

### Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service unavailable

## 🏗 Architecture & Design Patterns

### Backend Architecture

**Layered Architecture:**
```
Routes (HTTP Endpoints)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Database Models
    ↓
Database
```

**Design Patterns Used:**
1. **Repository Pattern** - Abstraction over data access
2. **Service Layer Pattern** - Business logic separation
3. **Dependency Injection** - Loose coupling
4. **Factory Pattern** - Object creation
5. **Singleton Pattern** - Database connection pooling

### Frontend Architecture

**Component Hierarchy:**
- **Page Components** - Route-based pages
- **Feature Components** - Reusable feature-specific components
- **UI Components** - Atomic reusable UI elements
- **Services** - API communication layer

**State Management:**
- React `useState` for local component state
- React `useEffect` for side effects
- Lifting state up for shared state

## 🔐 Security Considerations

✅ **Implemented:**
- CORS protection
- Trusted host middleware
- SQL injection prevention (SQLAlchemy ORM)
- Input validation with Pydantic
- HTTP status code proper usage
- Error handling without exposing internals
- Soft delete for users (data retention)

🔒 **Production Recommendations:**
- Use HTTPS/TLS for all communications
- Implement JWT authentication
- Add rate limiting on API endpoints
- Use environment variables for secrets
- Implement CSRF protection
- Add request logging and monitoring
- Use PostgreSQL instead of SQLite
- Set up proper database backups
- Implement API key validation for external integrations
- Add request timeout handling

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'developer',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('pending', 'in_progress', 'completed', 'blocked'),
  priority ENUM('low', 'medium', 'high', 'urgent'),
  assigned_to INTEGER FOREIGN KEY,
  created_by INTEGER FOREIGN KEY,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEXES: status, priority, assigned_to, due_date
);
```

### Comments Table
```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY,
  task_id INTEGER FOREIGN KEY,
  user_id INTEGER FOREIGN KEY,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testing Recommendations

### Backend Testing
```bash
# Install pytest
pip install pytest pytest-cov httpx

# Run tests
pytest

# With coverage
pytest --cov=.
```

**Test Structure:**
```python
# tests/test_tasks.py
def test_create_task(db):
    """Test task creation"""
    pass

def test_list_tasks_with_filters(db):
    """Test task listing with filters"""
    pass
```

### Frontend Testing
```bash
# Install Vitest
npm install -D vitest @testing-library/react

# Run tests
npm run test
```

## 📈 Performance Optimization

### Backend
- ✅ Database connection pooling
- ✅ Query optimization with indexes
- ✅ Lazy loading with SQLAlchemy relationships
- ✅ Pagination for list endpoints
- ✅ Async operations with httpx
- ✅ Request validation before DB queries

**Recommendations:**
- Add Redis caching for frequently accessed data
- Implement database query caching
- Use CDN for static assets
- Add gzip compression middleware
- Implement background jobs for heavy operations

### Frontend
- ✅ Code splitting with React Router
- ✅ Lazy component loading
- ✅ Optimized re-renders with React
- ✅ Responsive images
- ✅ Minification and tree-shaking

## 🚀 Deployment

### Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables

**Backend (.env):**
```env
DEBUG=False
DATABASE_URL=postgresql://user:pass@localhost/dbname
SECRET_KEY=<generate-random-key>
ALLOWED_ORIGINS=https://yourdomain.com
LOG_LEVEL=INFO
GITHUB_API_TOKEN=<your-token>
```

**Frontend (.env.production):**
```env
VITE_API_URL=https://api.yourdomain.com
```

## 📝 Seed Data

The application automatically creates default users on startup:
- Alice Johnson (alice@company.com) - Admin
- Bob Smith (bob@company.com) - Manager
- Charlie Davis (charlie@company.com) - Developer
- Diana Wilson (diana@company.com) - Developer
- Eve Martinez (eve@company.com) - Analyst

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
lsof -i :8000  # Find process
kill -9 <PID>  # Kill process
```

**Database connection error:**
- Verify DATABASE_URL is correct
- Check database credentials
- Ensure database service is running

**CORS errors:**
- Check ALLOWED_ORIGINS in config.py
- Verify frontend URL matches

### Frontend Issues

**Blank page after build:**
- Check browser console for errors
- Verify API URL is correct in .env.local
- Clear browser cache and rebuild

**API requests failing:**
- Check backend is running on port 8000
- Verify VITE_API_URL environment variable
- Check browser DevTools Network tab

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project

## 👨‍💻 Author

Built with ❤️ as a production-ready enterprise application template.

---

**Last Updated:** August 2026
**Version:** 1.0.0
