# Railway deployment - optimized for under 4GB
FROM node:18-alpine

WORKDIR /app

# Install only essential system deps (no build tools)
RUN apk add --no-cache bash curl

# First, build frontend efficiently
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci --silent
COPY frontend/src/ ./src/
COPY frontend/public/ ./public/
COPY frontend/tsconfig.json ./
COPY frontend/.env* ./
RUN npm run build

# Setup backend
WORKDIR /app
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --silent

# Copy backend source
COPY backend/ ./

# Copy built frontend to backend
RUN mkdir -p public && cp -r ../frontend/build/* public/

# Create minimal directories
RUN mkdir -p uploads h5p-content h5p-temp

# Cleanup to reduce size - remove frontend files and caches
WORKDIR /app
RUN rm -rf frontend
RUN rm -rf /root/.npm /tmp/* /var/cache/apk/*
RUN npm cache clean --force

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "server.js"]
