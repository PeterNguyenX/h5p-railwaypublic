#!/bin/sh

# Create necessary directories locally (without mounted volume)
mkdir -p /app/uploads/videos
mkdir -p /app/uploads/hls
mkdir -p /app/h5p-content
mkdir -p /app/h5p-temp
mkdir -p /app/h5p-libraries

# Set proper permissions
chown -R node:node /app/uploads /app/h5p-content /app/h5p-temp /app/h5p-libraries 2>/dev/null || true

echo "Starting H5P Interactive Video Platform..."
echo "Environment: ${NODE_ENV:-development}"
echo "Port: ${PORT:-3001}"

# Start the application
exec npm start
