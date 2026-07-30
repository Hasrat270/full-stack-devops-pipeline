# Stage 1: Build Frontend React App
FROM node:22-alpine AS frontend-builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate
COPY package.json pnpm-lock.yaml ./
COPY node_modules ./node_modules


COPY . .
ENV CI=true
RUN pnpm run build


# Stage 2: Production Lightweight Runner (Nginx reverse proxy)
FROM nginx:alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built static web frontend to Nginx html directory
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Expose HTTP port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
