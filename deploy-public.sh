#!/bin/bash
# deploy-public.sh - Script to deploy the public version of the application to Fly.io

echo "Deploying public version of the H5P Interactive Video Platform..."

# Build the frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Copy frontend build to backend public directory
echo "Copying frontend build to backend..."
mkdir -p backend/public/frontend
cp -r frontend/build/* backend/public/frontend/

# Deploy to Fly.io
echo "Deploying to Fly.io..."
fly deploy

echo "Deployment complete! Your public web interface should now be accessible."
echo "Visit: https://h5p-minimal.fly.dev to access your application."
