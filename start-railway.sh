#!/bin/bash

# Railway startup script
echo "Starting H5P Interactive Video Platform..."

# Set default port for Railway
export PORT=${PORT:-3001}

# Create necessary directories
mkdir -p uploads/videos uploads/hls h5p-content h5p-temp h5p-libraries

# Start the application
echo "Starting server on port $PORT..."
node server.js
