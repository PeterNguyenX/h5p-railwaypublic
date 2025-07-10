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

# Install system dependencies for video processing and native modules
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    libc6-compat \
    gcompat

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend to backend public directory
COPY --from=frontend-build /app/frontend/build ./public/frontend

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Create directories for file storage and set up volume structure
RUN mkdir -p data/uploads/videos data/uploads/hls data/h5p-content data/h5p-temp data/h5p-libraries

# Create symbolic links to the mounted volume (will be created at runtime)
RUN mkdir -p uploads h5p-content h5p-temp h5p-libraries

# Set proper permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["./start.sh"]
