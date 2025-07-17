#!/bin/bash
# simplified-deploy.sh - Ultra simple deployment script

echo "Starting simple deployment to Fly.io..."

# Create the volumes if they don't exist
if ! fly volumes list | grep -q "h5p_data"; then
    echo "Creating volumes..."
    fly volume create h5p_data -r sjc -n 2 || echo "Volume may already exist"
fi

# Deploy with a simpler configuration
echo "Deploying the application..."
fly deploy -c fly.no-db.toml --now

echo "Deployment complete!"
echo "Visit: https://h5p-minimal.fly.dev to access your application"
