# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Prepare Backend
FROM node:20-bookworm-slim AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Stage 3: Final Production Image
FROM node:20-bookworm-slim
WORKDIR /app

# Install system dependencies for PDF generation (PhantomJS/html-pdf)
RUN apt-get update && apt-get install -y \
    libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*

# Ensure production environment
ENV NODE_ENV=production
ENV PORT=8888 

# Copy backend dependencies and source
COPY --from=backend-builder --chown=node:node /app/backend /app/backend

# Copy built frontend assets into backend/public
COPY --from=frontend-builder --chown=node:node /app/frontend/dist /app/backend/public

# Ensure upload directories exist with correct permissions
RUN mkdir -p /app/backend/src/public/uploads/setting && \
    chown -R node:node /app/backend/src/public/uploads

# Switch to the pre-existing non-privileged node user
USER node

EXPOSE 8888

WORKDIR /app/backend
CMD ["node", "src/server.js"]
