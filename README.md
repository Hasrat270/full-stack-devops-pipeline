# DevOps CI/CD Automation & Docker Containerization

Automated CI/CD testing, building, and multi-container Docker deployment pipeline for a modern full-stack web application.

---

## 🛠️ Tech Stack & Features

- **Frontend**: React, TypeScript, Vite, Glassmorphism Dashboard UI, Lucide Icons.
- **Backend API**: Node.js, Express, REST Telemetry endpoints (`/api/health`, `/api/pipeline`, `/api/pipeline/trigger`).
- **Testing & Quality**: Vitest unit test suite, Oxlint static code analyzer.
- **Containerization**: Docker multi-stage builds (`Dockerfile`, `Dockerfile.api`), Nginx Reverse Proxy (`nginx.conf`), Docker Compose.
- **CI/CD Workflow**: GitHub Actions pipeline (`.github/workflows/ci-cd.yml`).

---

## 🚀 How to Run Manually

### Option 1: Docker Containers (Recommended Production Mode)

Run both Web Frontend & Express API as isolated Docker containers using Docker Compose:

```bash
# 1. Build and start the containers in detached mode
docker compose up --build -d

# 2. View running container status
docker compose ps

# 3. Access the web app:
# Open http://localhost:8080 in your browser (Nginx Reverse Proxy)

# 4. Stop and remove containers when done:
docker compose down
```

---

### Option 2: Local Development Mode

Run the application directly using `pnpm`:

```bash
# 1. Install dependencies
pnpm install

# 2. Run static lint checks (Oxlint)
pnpm run lint

# 3. Run automated tests (Vitest)
pnpm run test:ci

# 4. Start local development server (Web App + Proxy)
pnpm run dev
# Open http://localhost:5173 in your browser

# 5. In a separate terminal, start the Backend API Telemetry server:
pnpm dlx tsx server/index.ts
```

---

## 🧪 CI/CD Pipeline Stages

1. **Linting**: Executed via `oxlint` to ensure static code quality.
2. **Automated Unit Testing**: Executed via `vitest run` covering Express API routes.
3. **Frontend Compilation**: TypeScript compilation (`tsc -b`) & Vite bundling.
4. **Docker Image Packaging**: Multi-stage build creating lightweight Nginx & Node container images.
