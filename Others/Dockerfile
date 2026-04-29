# Railway deployment - using pre-built frontend
FROM node:18-alpine

WORKDIR /app

# Install only essential system deps
RUN apk add --no-cache bash curl

# Setup backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --production --silent

# Copy backend source
COPY backend/ ./

# Copy pre-built frontend to backend public directory
RUN mkdir -p public
COPY frontend/build/ ./public/

# Create minimal directories
RUN mkdir -p uploads h5p-content h5p-temp

# Cleanup to reduce size
RUN rm -rf /root/.npm /tmp/* /var/cache/apk/*
RUN npm cache clean --force

EXPOSE 3001

CMD ["node", "server.js"]
