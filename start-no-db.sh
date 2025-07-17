#!/bin/sh

# Create necessary directories in the mounted volume
mkdir -p /app/data/uploads/videos
mkdir -p /app/data/uploads/hls
mkdir -p /app/data/h5p-content
mkdir -p /app/data/h5p-temp
mkdir -p /app/data/h5p-libraries

# Remove existing directories/links if they exist
rm -rf /app/uploads /app/h5p-content /app/h5p-temp /app/h5p-libraries

# Create symbolic links to the mounted volume
ln -sf /app/data/uploads /app/uploads
ln -sf /app/data/h5p-content /app/h5p-content
ln -sf /app/data/h5p-temp /app/h5p-temp
ln -sf /app/data/h5p-libraries /app/h5p-libraries

# Start the simplified production server
exec node simplified-production-server.js
