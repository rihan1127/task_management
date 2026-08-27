# Quick Start Guide

Get the Task Management Dashboard running in 5 minutes!

## Option 1: Docker (Recommended)

### Prerequisites
- Docker & Docker Compose installed

### Steps

1. **Clone and navigate to project**
```bash
cd task-management-dashboard
```

2. **Start services**
```bash
docker-compose up -d
```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

4. **View logs**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

5. **Stop services**
```bash
docker-compose down
```

## Option 2: Local Setup (Detailed)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start server
python main.py
```

**Backend will run on:** http://localhost:8000

### Frontend Setup (in new terminal)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend will run on:** http://localhost:5173

## Default Credentials

The app comes with pre-created users:

| Name | Email | Role |
|------|-------|------|
| Alice Johnson | alice@company.com | admin |
| Bob Smith | bob@company.com | manager |
| Charlie Davis | charlie@company.com | developer |
| Diana Wilson | diana@company.com | developer |
| Eve Martinez | eve@company.com | analyst |

Use any email to simulate logging in. (Authentication is mocked for demo)

## First Steps

1. **View Dashboard**
   - Open http://localhost:5173
   - You'll see the main dashboard with task statistics

2. **Create a Task**
   - Navigate to "Tasks" section
   - Click "+ New Task"
   - Fill in details and submit

3. **View Task Details**
   - Click on a task in the list
   - See full details, comments, and history

4. **Manage Users**
   - Go to "Users" section
   - Create new team members
   - Assign tasks to them

## API Testing

### Using cURL

Get all tasks:
```bash
curl http://localhost:8000/api/tasks
```

Create a task:
```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task","priority":"high"}'
```

### Using Swagger UI

Visit http://localhost:8000/docs for interactive API documentation

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000
# Kill process
kill -9 <PID>
```

### Database Errors

```bash
# Reset database (SQLite)
rm backend/task_management.db
# Restart backend - it will recreate
```

### Frontend Not Connecting to Backend

Check that:
1. Backend is running on port 8000
2. Browser's Network tab shows requests to `http://localhost:8000/api`
3. No CORS errors in console

## Building for Production

### Backend
```bash
cd backend
docker build -t task-api:latest .
docker run -p 8000:8000 task-api:latest
```

### Frontend
```bash
cd frontend
npm run build
# dist/ folder contains production-ready files
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the API at http://localhost:8000/docs
- Customize colors in `frontend/tailwind.config.js`
- Update user roles and permissions
- Add more external API integrations

## Need Help?

Check the README.md file for:
- Detailed architecture explanation
- API endpoint documentation
- Database schema information
- Security considerations
- Deployment instructions

---

**Happy task managing! 🚀**
