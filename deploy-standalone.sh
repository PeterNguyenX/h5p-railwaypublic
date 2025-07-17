#!/bin/bash
# deploy-standalone.sh - Deploy a minimal standalone server to Fly.io

echo "Deploying standalone version of H5P Interactive Video Platform..."
echo "This version has no external dependencies and should be very reliable."

# Create the app if it doesn't exist
fly apps list | grep -q h5p-standalone || fly apps create h5p-standalone

# Deploy the application with the standalone configuration
fly deploy --config fly.standalone.toml --vm-memory 512

echo "Deployment complete!"
echo "Visit: https://h5p-standalone.fly.dev to access your public web interface."
