#!/bin/bash
# deploy-no-db.sh - Script to deploy the public version without database dependencies

echo "Deploying simplified version of the H5P Interactive Video Platform without database dependencies..."

# Build the frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Copy frontend build to backend public directory
echo "Copying frontend build to backend..."
mkdir -p backend/public/frontend
cp -r frontend/build/* backend/public/frontend/

# Deploy to Fly.io using no-db configuration
echo "Deploying to Fly.io..."
# Using --auto-confirm to skip confirmation prompts
fly deploy --config fly.no-db.toml --auto-confirm

echo "Deployment complete!"
