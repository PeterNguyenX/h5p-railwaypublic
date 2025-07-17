#!/bin/bash
# deploy-simple.sh - Deploy a simplified version without volume requirements

echo "Deploying simplified version of H5P Interactive Video Platform..."
echo "This version doesn't require database or volumes."

# Deploy the application with the simplified configuration
fly deploy --config fly.simple.toml

echo "Deployment complete!"
echo "Visit: https://h5p-simple.fly.dev to access your application."
