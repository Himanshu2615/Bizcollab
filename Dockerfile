# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Prepare Backend
FROM node:20-slim AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Stage 3: Final Production Image
FROM node:20-slim
WORKDIR /app

# Ensure production environment
ENV NODE_ENV=production
ENV PORT=8888

# Copy backend dependencies and source
COPY --from=backend-builder --chown=node:node /app/backend /app/backend

# Copy built frontend assets into backend/public
# The backend/src/app.js looks for static files in ../public relative to its location
COPY --from=frontend-builder --chown=node:node /app/frontend/dist /app/backend/public

# Switch to the pre-existing non-privileged node user for security
USER node

EXPOSE 8888

WORKDIR /app/backend
CMD ["node", "src/server.js"]
