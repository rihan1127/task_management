# Deployment Guide

Complete guide for deploying the Task Management Dashboard in different environments.

## Table of Contents
1. [Development Setup](#development-setup)
2. [Staging Deployment](#staging-deployment)
3. [Production Deployment](#production-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Cloud Platforms](#cloud-platforms)
6. [Database Migrations](#database-migrations)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Development Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- SQLite (or PostgreSQL)
- Git

### Step 1: Clone Repository

```bash
git clone https://github.com/yourname/task-management-dashboard.git
cd task-management-dashboard
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Start development server
python main.py
```

**Backend runs on:** `http://localhost:8000`

### Step 3: Frontend Setup

```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs on:** `http://localhost:5173`

### Troubleshooting

**Port already in use:**
```bash
# Kill process on port 8000
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 5173
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**Database errors:**
```bash
# Reset database
rm backend/task_management.db

# Restart backend - it will recreate
```

---

## Staging Deployment

### Environment Setup

Create `.env.staging`:
```env
DEBUG=False
DATABASE_URL=postgresql://user:pass@postgres-staging.example.com/taskdb_staging
SECRET_KEY=<generate-secure-key>
ALLOWED_ORIGINS=https://staging.taskhub.example.com
LOG_LEVEL=INFO
```

### Using Docker Compose

```bash
# Build images
docker-compose -f docker-compose.staging.yml build

# Start services
docker-compose -f docker-compose.staging.yml up -d

# View logs
docker-compose -f docker-compose.staging.yml logs -f
```

### Manual Deployment

**Backend:**
```bash
cd backend
pip install -r requirements.txt
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
# Serve dist/ with nginx or your web server
```

---

## Production Deployment

### Security Checklist

- [ ] Change SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Use HTTPS/TLS
- [ ] Configure firewall
- [ ] Set up regular backups
- [ ] Enable logging and monitoring
- [ ] Configure rate limiting
- [ ] Set up SSL certificates
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets

### Backend Production Setup

1. **Install system dependencies:**
```bash
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv postgresql postgresql-contrib nginx
```

2. **Create application user:**
```bash
sudo useradd -m -s /bin/bash taskapp
sudo su - taskapp
```

3. **Clone repository:**
```bash
git clone https://github.com/yourname/task-management-dashboard.git
cd task-management-dashboard/backend
```

4. **Setup Python environment:**
```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

5. **Create production environment file:**
```bash
cat > .env << EOF
DEBUG=False
DATABASE_URL=postgresql://taskuser:securepass@localhost/taskdb
SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
ALLOWED_ORIGINS=https://taskhub.example.com
LOG_LEVEL=INFO
EOF
```

6. **Create systemd service file:**

Create `/etc/systemd/system/task-api.service`:
```ini
[Unit]
Description=Task Management Dashboard API
After=network.target postgresql.service

[Service]
Type=notify
User=taskapp
WorkingDirectory=/home/taskapp/task-management-dashboard/backend
Environment="PATH=/home/taskapp/task-management-dashboard/backend/venv/bin"
ExecStart=/home/taskapp/task-management-dashboard/backend/venv/bin/gunicorn \
    main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --access-logfile /var/log/task-api/access.log \
    --error-logfile /var/log/task-api/error.log

Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

7. **Start service:**
```bash
sudo mkdir -p /var/log/task-api
sudo chown taskapp:taskapp /var/log/task-api
sudo systemctl daemon-reload
sudo systemctl enable task-api
sudo systemctl start task-api
```

### Frontend Production Setup

1. **Build application:**
```bash
cd frontend
npm install
npm run build
```

2. **Configure Nginx:**

Create `/etc/nginx/sites-available/taskhub`:
```nginx
upstream task_api {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name taskhub.example.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name taskhub.example.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/taskhub.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/taskhub.example.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Root directory
    root /home/taskapp/task-management-dashboard/frontend/dist;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # API proxy
    location /api/ {
        proxy_pass http://task_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. **Enable site and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/taskhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Setup SSL with Let's Encrypt:**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d taskhub.example.com
```

### Database Setup (PostgreSQL)

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE taskdb;
CREATE USER taskuser WITH PASSWORD 'securepassword';
ALTER ROLE taskuser SET client_encoding TO 'utf8';
ALTER ROLE taskuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE taskuser SET default_transaction_deferrable TO on;
ALTER ROLE taskuser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE taskdb TO taskuser;
\q
```

### Backups

**Daily backup script** `/home/taskapp/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/taskapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -U taskuser taskdb | gzip > $BACKUP_DIR/taskdb_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "taskdb_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /home/taskapp/backup.sh
```

---

## Docker Deployment

### Build Docker Images

**Backend:**
```bash
cd backend
docker build -t task-api:latest .
```

**Frontend:**
```bash
cd frontend
docker build -t task-ui:latest .
```

### Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Push to Registry

```bash
# Tag images
docker tag task-api:latest myregistry.azurecr.io/task-api:latest
docker tag task-ui:latest myregistry.azurecr.io/task-ui:latest

# Push to registry
docker push myregistry.azurecr.io/task-api:latest
docker push myregistry.azurecr.io/task-ui:latest
```

---

## Cloud Platforms

### AWS Deployment

**Using ECS:**
1. Create ECR repositories
2. Push images to ECR
3. Create ECS task definitions
4. Create ECS service
5. Configure ALB for routing
6. Use RDS for database

**Infrastructure as Code (Terraform):**
```hcl
# Define EC2 instance
resource "aws_instance" "task_api" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  key_name      = aws_key_pair.deployer.key_name

  tags = {
    Name = "task-management-dashboard"
  }
}

# Define RDS database
resource "aws_db_instance" "postgres" {
  identifier     = "task-db"
  engine         = "postgres"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  # ... more configuration
}
```

### Heroku Deployment

1. **Create Procfile:**
```
web: gunicorn main:app --worker-class uvicorn.workers.UvicornWorker
```

2. **Deploy:**
```bash
heroku create task-management-dashboard
git push heroku main
heroku run "python -c 'from database.connection import init_db; init_db()'"
```

### DigitalOcean App Platform

```yaml
# app.yaml
name: task-management-dashboard
services:
  - name: api
    github:
      repo: username/task-management-dashboard
      branch: main
    build_command: pip install -r requirements.txt
    run_command: gunicorn main:app --worker-class uvicorn.workers.UvicornWorker
  - name: web
    github:
      repo: username/task-management-dashboard
      branch: main
    build_command: cd frontend && npm install && npm run build
    http_port: 3000
```

---

## Database Migrations

### Using Alembic

1. **Install Alembic:**
```bash
pip install alembic
```

2. **Initialize Alembic:**
```bash
alembic init alembic
```

3. **Create migration:**
```bash
alembic revision --autogenerate -m "Add task status enum"
```

4. **Apply migration:**
```bash
alembic upgrade head
```

---

## Monitoring & Maintenance

### Application Monitoring

**Using Prometheus:**
```python
from prometheus_client import Counter, Histogram
import time

request_count = Counter('requests_total', 'Total requests')
request_duration = Histogram('request_duration_seconds', 'Request duration')

@app.middleware("http")
async def add_metrics(request: Request, call_next):
    request_count.inc()
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    request_duration.observe(duration)
    return response
```

### Log Aggregation

Configure ELK Stack or similar for log aggregation:
- Elasticsearch for storage
- Logstash for processing
- Kibana for visualization

### Health Checks

```bash
# Check API health
curl http://localhost:8000/health

# Check database
curl http://localhost:8000/api/health
```

### Performance Optimization

- Enable Redis caching
- Use CDN for static assets
- Implement database query caching
- Monitor and optimize slow queries

### Scheduled Maintenance

- Database backups (daily)
- Log rotation (daily)
- Security patches (weekly)
- Dependency updates (monthly)

---

## Troubleshooting Deployment Issues

### Application won't start

1. Check logs: `systemctl status task-api`
2. Verify environment variables: `echo $DATABASE_URL`
3. Test database connection
4. Check port availability

### High CPU/Memory usage

1. Increase worker processes
2. Implement caching
3. Optimize database queries
4. Monitor with `top` or `htop`

### Database connection issues

1. Verify credentials
2. Check database is running
3. Test connection manually
4. Review firewall rules

### SSL certificate issues

1. Verify certificate expiration: `certbot certificates`
2. Renew certificates: `certbot renew`
3. Check nginx configuration
4. Restart nginx: `systemctl restart nginx`

---

## Post-Deployment Checklist

- [ ] Verify application is running
- [ ] Check SSL certificate
- [ ] Test all API endpoints
- [ ] Verify database backups
- [ ] Setup monitoring
- [ ] Configure alerts
- [ ] Document custom configurations
- [ ] Train team on deployment process
- [ ] Setup disaster recovery plan
- [ ] Document admin procedures

---

## Support

For deployment issues, check:
- Application logs
- System logs
- Database logs
- Nginx error logs
- Security group rules
- Environment variables
