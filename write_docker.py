import os

def w(path, content):
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Written: {path}")

w("frontend/Dockerfile", """# ── Stage 1: build ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
ARG VITE_API_URL=http://localhost:8000/api
ARG VITE_WS_URL=ws://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

# ── Stage 2: serve ──
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
""")

w("frontend/nginx.conf", """server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to backend
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy WebSocket
    location /ws/ {
        proxy_pass http://backend:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Cache static assets
    location ~* \\.(js|css|png|jpg|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
""")

w("docker-compose.yml", """version: '3.9'

services:
  # ── PostgreSQL ──────────────────────────────────────────
  db:
    image: postgres:15-alpine
    container_name: task-db
    environment:
      POSTGRES_DB: taskdb
      POSTGRES_USER: taskuser
      POSTGRES_PASSWORD: taskpass123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskuser -d taskdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── Backend API ─────────────────────────────────────────
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: task-api
    env_file: .env.docker
    environment:
      DATABASE_URL: postgresql://taskuser:taskpass123@db:5432/taskdb
      ALLOWED_ORIGINS: http://localhost,http://localhost:80
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app
    healthcheck:
      test: ["CMD", "python", "-c", "import httpx; httpx.get('http://localhost:8000/health')"]
      interval: 15s
      timeout: 5s
      retries: 4
      start_period: 10s

  # ── Frontend (Nginx) ────────────────────────────────────
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
      args:
        VITE_API_URL: http://localhost:8000/api
        VITE_WS_URL: ws://localhost:8000
    container_name: task-ui
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy

volumes:
  postgres_data:

networks:
  default:
    name: task-network
""")

w(".env.docker", """# Copy to .env for Docker deployment
DEBUG=False
SECRET_KEY=change-me-in-production-use-a-long-random-string
DATABASE_URL=postgresql://taskuser:taskpass123@db:5432/taskdb
LOG_LEVEL=INFO
GITHUB_API_TOKEN=
""")

print("Docker files written.")
