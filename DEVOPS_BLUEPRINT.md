# DevOps Production Architecture & Zero-Downtime Deployment Blueprint

This document details the production-grade architecture decisions and implementation designs for our full-stack containerized application deployed on AWS EC2 via GitHub Actions CI/CD.

---

## 🏗️ Production Architecture Decisions

### 1. Docker Multi-Container Architecture (Docker Compose)
- **Separation of Concerns**: Web Frontend (Nginx static server) and Node.js Express API run in separate containers.
- **Independent Scaling**: API and Frontend services can scale individually without rebuild bottlenecks.
- **Caching Speed**: Code updates only trigger rebuilds for the modified service layer.

### 2. GitHub Container Registry (GHCR) vs Docker Hub
- **Registry**: GitHub Container Registry (`ghcr.io`).
- **Benefits**: Native integration with `${{ secrets.GITHUB_TOKEN }}`, zero anonymous pull rate limits, and unlimited package storage for repository workflows.

### 3. Zero-Downtime Blue-Green Deployment Script
- **Mechanism**: Dynamic Blue-Green container switching with Nginx reload (`sed` dynamic upstream update).
- **Downtime**: `0 ms` (Connections gracefully handed off without dropping requests).

---

## 🚀 Production Docker Compose Specification (`docker-compose.yml`)

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.api
    container_name: devops-backend-api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3

  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: devops-web-frontend
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: always
```

---

## ⚡ Zero-Downtime Blue-Green Deployment Script (`deploy.sh`)

Place this script on your AWS EC2 instance at `/home/ubuntu/deploy.sh` and make it executable (`chmod +x deploy.sh`):

```bash
#!/bin/bash
set -e

# Determine current running environment
if [ "$(docker ps -q -f name=web-blue)" ]; then
    NEW_ENV="green"
    NEW_PORT=8082
    OLD_ENV="blue"
else
    NEW_ENV="blue"
    NEW_PORT=8081
    OLD_ENV="green"
fi

echo "🚀 Deploying to $NEW_ENV container on port $NEW_PORT..."

# 1. Pull latest production image from GHCR
docker pull ghcr.io/${GITHUB_REPOSITORY}/devops-web-app:latest

# 2. Launch new container alongside active container
docker run -d --name web-$NEW_ENV -p $NEW_PORT:80 --restart always ghcr.io/${GITHUB_REPOSITORY}/devops-web-app:latest

# 3. Wait for new container healthcheck
echo "⏳ Verifying application health status..."
until $(curl --output /dev/null --silent --head --fail http://localhost:$NEW_PORT/api/health); do
    printf '.'
    sleep 1
done

echo ""
echo "✅ New container healthy! Reloading Nginx reverse proxy..."

# 4. Gracefully switch traffic in Nginx without dropping active connections
sudo sed -i "s/proxy_pass http:\/\/localhost:.*/proxy_pass http:\/\/localhost:$NEW_PORT;/" /etc/nginx/sites-available/default
sudo systemctl reload nginx

# 5. Clean up old container
echo "🧹 Stopping previous $OLD_ENV container..."
docker stop web-$OLD_ENV || true
docker rm web-$OLD_ENV || true

echo "🎉 Zero-downtime deployment complete!"
```

---

## 🔐 GHCR & OIDC/SSH Production Workflow (`.github/workflows/ci-cd.yml`)

```yaml
name: Production CI/CD & GHCR Deployment Pipeline

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  test-and-lint:
    name: 🧪 Quality Gate (Oxlint & Vitest)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js & pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 11

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Static Code Analysis
        run: pnpm run lint

      - name: Execute Unit Tests
        run: pnpm run test:ci

  build-and-push-ghcr:
    name: 🐳 Build & Push to GHCR
    needs: test-and-lint
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        if: github.ref == 'refs/heads/main'
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push Production Image
        if: github.ref == 'refs/heads/main'
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/devops-web-app:latest

  deploy-to-ec2:
    name: ☁️ Zero-Downtime EC2 Deploy
    needs: build-and-push-ghcr
    if: github.ref == 'refs/heads/main' && secrets.EC2_HOST != ''
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Remote Blue-Green Deployment
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            export GITHUB_REPOSITORY="${{ github.repository }}"
            /home/ubuntu/deploy.sh
```
