FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache bash postgresql-client curl ffmpeg python3 make g++

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install

# Copy source code
WORKDIR /app
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Setup backend
WORKDIR /app/backend
RUN mkdir -p public uploads/videos uploads/hls h5p-content h5p-temp h5p-libraries

# Copy built frontend to backend public directory
RUN cp -r ../frontend/build/* public/ 2>/dev/null || echo "Frontend build not found"

EXPOSE 3001

# Create upload directories
RUN mkdir -p uploads h5p-content h5p-temp h5p-libraries

# Set proper permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the server directly
CMD ["node", "server.js"]
