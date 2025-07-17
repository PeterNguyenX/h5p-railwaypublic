#!/bin/bash
# deploy-public-web.sh - Deploy a public web interface without volume requirements

echo "Deploying public web interface for H5P Interactive Video Platform..."
echo "This version doesn't require database or volumes."

# Create the app if it doesn't exist
fly apps list | grep -q h5p-public || fly apps create h5p-public

# Deploy the application with the public configuration
fly deploy --config fly.public.toml

echo "Deployment complete!"
echo "Visit: https://h5p-public.fly.dev to access your public web interface."
