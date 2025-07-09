# Deploy H5P Interactive Video Platform to Fly.io

## Prerequisites

1. **Install Fly CLI**
   ```bash
   # macOS
   brew install flyctl
   
   # Linux
   curl -L https://fly.io/install.sh | sh
   
   # Windows
   powershell -c "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Create Fly.io Account**
   - Go to https://fly.io/app/sign-up
   - Sign up for a free account

3. **Login to Fly.io**
   ```bash
   fly auth login
   ```

## Pre-Deployment Setup

### 1. Initialize Git Repository (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Push to GitHub (Required for Fly.io deployment)
```bash
# Create a repository on GitHub first, then:
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### 3. Environment Configuration
The deployment uses environment variables for configuration. Key variables are set automatically by the deployment script, but you can customize them:

```bash
# View current secrets
fly secrets list

# Set additional secrets if needed
fly secrets set CUSTOM_VAR=value
```

## Deployment Methods

### Method 1: Automated Deployment (Recommended)
```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

### Method 2: Manual Deployment
```bash
# 1. Build frontend
cd frontend
npm run build
cd ..

# 2. Create Fly.io app
fly apps create h5p-interactive-video

# 3. Create persistent volumes
fly volumes create h5p_uploads --size 5 --region sjc
fly volumes create h5p_content --size 1 --region sjc

# 4. Set environment variables
fly secrets set NODE_ENV=production JWT_SECRET=$(openssl rand -base64 32)

# 5. Deploy
fly deploy
```

## Configuration Files

### 1. `Dockerfile`
Multi-stage build that:
- Builds the React frontend
- Sets up Node.js backend with FFmpeg
- Copies frontend build to backend public directory
- Configures proper permissions and health checks

### 2. `fly.toml`
Fly.io configuration that:
- Sets up HTTP service on port 3001
- Configures health checks
- Mounts persistent volumes for uploads and content
- Sets resource limits (1GB RAM, 1 CPU)

### 3. `.dockerignore`
Excludes unnecessary files from Docker build:
- Development dependencies
- Local configuration files
- Documentation and test files

## Post-Deployment

### 1. Check Status
```bash
fly status
```

### 2. View Logs
```bash
fly logs
```

### 3. SSH into App
```bash
fly ssh console
```

### 4. Scale Resources (if needed)
```bash
# Increase memory
fly scale memory 2048

# Add more instances
fly scale count 2
```

## Persistent Storage

The app uses two persistent volumes:
- `h5p_uploads` (5GB): For video uploads and processed files
- `h5p_content` (1GB): For H5P content and libraries

## Domain Configuration

### Default Domain
Your app will be available at: `https://h5p-interactive-video.fly.dev`

### Custom Domain
```bash
# Add custom domain
fly certs add yourdomain.com

# Configure DNS
# Add CNAME record: yourdomain.com -> h5p-interactive-video.fly.dev
```

## Environment Variables

Key environment variables set automatically:
- `NODE_ENV=production`
- `JWT_SECRET`: Auto-generated secure secret
- `LTI_SECRET`: Auto-generated for LMS integration
- `SESSION_SECRET`: Auto-generated for session security
- `APP_URL`: Your app's URL
- `CORS_ORIGIN`: Configured for your domain

## Database Configuration

The app uses SQLite by default, which works well for small to medium deployments. For production at scale, consider:

1. **PostgreSQL on Fly.io**
   ```bash
   fly postgres create
   fly postgres attach <postgres-app-name>
   ```

2. **External Database**
   Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` secrets

## Troubleshooting

### Common Issues

1. **"Failed to load latest GitHub commit"**
   - Ensure your code is committed to Git
   - Push to GitHub before deployment
   - Check repository permissions

2. **Build Failures**
   - Check Dockerfile syntax
   - Verify all dependencies are listed in package.json
   - Review build logs with `fly logs`

3. **Runtime Errors**
   - Check application logs: `fly logs`
   - Verify environment variables: `fly secrets list`
   - SSH into app and check file permissions: `fly ssh console`

4. **Frontend Not Loading**
   - Ensure frontend build completed successfully
   - Check that static files are in `public/frontend`
   - Verify React routing configuration

### Debug Commands
```bash
# View detailed logs
fly logs --app h5p-interactive-video

# Check app info
fly info

# View metrics
fly metrics

# Restart app
fly restart
```

## Security Considerations

1. **HTTPS**: Automatically enabled by Fly.io
2. **Environment Variables**: Secrets are encrypted
3. **File Uploads**: Limited to 500MB by default
4. **Rate Limiting**: Configured for production use
5. **CORS**: Restricted to your domain

## Monitoring

- **Health Checks**: Automatic via `/api/health` endpoint
- **Logs**: Available via `fly logs`
- **Metrics**: Available via `fly metrics`
- **Alerts**: Can be configured in Fly.io dashboard

## Cost Optimization

1. **Auto-stop**: Machines stop when idle
2. **Shared CPU**: More cost-effective than dedicated
3. **Resource Limits**: Set appropriate memory/CPU limits
4. **Volume Sizing**: Start small and scale as needed

## Updates and Maintenance

### Deploy Updates
```bash
# Pull latest changes
git pull origin main

# Deploy update
fly deploy
```

### Backup Data
```bash
# Backup volumes
fly volumes list
fly ssh console -C "tar -czf backup.tar.gz /app/uploads"
```

### Monitor Resources
```bash
# Check resource usage
fly metrics
fly status
```

## Support

- **Fly.io Documentation**: https://fly.io/docs/
- **Community Forum**: https://community.fly.io/
- **GitHub Issues**: For app-specific issues
