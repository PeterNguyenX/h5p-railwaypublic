#!/bin/bash

# H5P Interactive Video Platform - Fly.io Deployment Script

echo "🚀 Deploying H5P Interactive Video Platform to Fly.io"
echo "=================================================="

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI is not installed. Please install it first:"
    echo "   macOS: brew install flyctl"
    echo "   Linux: curl -L https://fly.io/install.sh | sh"
    echo "   Windows: powershell -c \"iwr https://fly.io/install.ps1 -useb | iex\""
    exit 1
fi

# Check if logged in to fly
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Please login first:"
    echo "   fly auth login"
    exit 1
fi

# Ensure we're in the project directory
cd "$(dirname "$0")"

# Check if Git repository exists and is clean
if [ ! -d ".git" ]; then
    echo "❌ This is not a Git repository. Please initialize Git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. Committing them now..."
    git add .
    git commit -m "Pre-deployment commit - $(date)"
fi

# Build frontend first
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Create app if it doesn't exist
if ! fly apps list | grep -q "h5p-interactive-video"; then
    echo "🆕 Creating new Fly.io app..."
    fly apps create h5p-interactive-video
fi

# Create volumes if they don't exist
echo "💾 Setting up persistent volumes..."
fly volumes create h5p_uploads --size 5 --region sjc || echo "Volume h5p_uploads already exists"
fly volumes create h5p_content --size 1 --region sjc || echo "Volume h5p_content already exists"

# Set environment variables
echo "🔧 Setting environment variables..."
fly secrets set \
    NODE_ENV=production \
    JWT_SECRET=$(openssl rand -base64 32) \
    LTI_SECRET=$(openssl rand -base64 32) \
    SESSION_SECRET=$(openssl rand -base64 32) \
    APP_URL=https://h5p-interactive-video.fly.dev \
    DB_HOST=localhost \
    DB_NAME=h5p_production \
    CORS_ORIGIN=https://h5p-interactive-video.fly.dev

# Deploy the application
echo "🚀 Deploying to Fly.io..."
fly deploy --remote-only

# Check deployment status
echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://h5p-interactive-video.fly.dev"
echo "📊 Check status: fly status"
echo "📝 View logs: fly logs"
echo "🔧 SSH into app: fly ssh console"

# Open the app in browser
read -p "Would you like to open the app in your browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    fly open
fi
