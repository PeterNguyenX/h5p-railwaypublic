# Multi-stage build for H5P Interactive Video Platform
# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Setup backend with frontend build
FROM node:18-alpine AS production

WORKDIR /app

# Install system dependencies for video processing
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend to backend public directory
COPY --from=frontend-build /app/frontend/build ./public/frontend

# Create necessary directories
RUN mkdir -p uploads/videos uploads/hls h5p-content h5p-temp h5p-libraries

# Set proper permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["npm", "start"]
