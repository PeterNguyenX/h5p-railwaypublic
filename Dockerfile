# Minimal Railway build - optimized for under 4GB limit
FROM node:18-alpine

WORKDIR /app

# Install only essential dependencies
RUN apk add --no-cache bash curl

# First, build frontend locally and copy the build
# This avoids installing frontend dependencies in Docker
COPY frontend/build/ ./public/

# Copy only backend files
COPY backend/package*.json ./
COPY backend/ ./

# Install only production dependencies for backend
RUN npm ci --production --silent

# Create minimal upload directories
RUN mkdir -p uploads h5p-content h5p-temp

# Clean up to reduce image size
RUN rm -rf /root/.npm /tmp/* /var/cache/apk/*
RUN npm cache clean --force

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "server.js"]
