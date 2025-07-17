# Railway Deployment Guide for H5P Interactive Video Platform

This guide walks you through deploying the H5P Interactive Video Platform to Railway, a free hosting service that's simpler than Fly.io.

## Prerequisites

1. A GitHub account
2. A Railway account (sign up at [railway.app](https://railway.app))
3. Your code pushed to a GitHub repository

## Step 1: Prepare Your Project

### Files Created/Modified for Railway:

1. **Dockerfile.railway** - Railway-specific Dockerfile ✅
2. **start-railway.sh** - Railway startup script ✅
3. **.railwayignore** - Files to exclude from deployment ✅
4. **Updated backend/server.js** - CORS configuration for Railway domains ✅

### Key Changes Made:

- **Database**: Modified to use Railway's PostgreSQL with `DATABASE_URL` ✅
- **CORS**: Updated to allow Railway subdomains (`*.railway.app`) ✅
- **Static Files**: Configured to serve React frontend from backend ✅
- **Port Binding**: Uses Railway's `PORT` environment variable ✅

## Step 2: Deploy to Railway

### Option A: Deploy from GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Connect to Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "Deploy Now" 
   - Choose "Deploy from GitHub repo"
   - Select your repository
   - Choose the branch (usually `main`)

3. **Configure the deployment**:
   - Railway will detect it's a Node.js project
   - Set the **Dockerfile path** to `Dockerfile.railway`
   - Set the **Root directory** to `/` (if not auto-detected)

### Option B: Deploy via Railway CLI

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

## Step 3: Add PostgreSQL Database

1. **In your Railway dashboard**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will create a PostgreSQL instance
   - Note the connection details in the "Variables" tab

## Step 4: Configure Environment Variables

In your Railway project dashboard, go to **Variables** and add:

### Required Variables:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_super_secure_jwt_secret_here
SESSION_SECRET=your_super_secure_session_secret_here
```

### Optional Variables:
```
WORDPRESS_URL=your_wordpress_site_url
WORDPRESS_USERNAME=your_wp_username  
WORDPRESS_PASSWORD=your_wp_password
```

**Important**: Railway automatically provides `DATABASE_URL` when you add PostgreSQL. You don't need to set it manually.

## Step 5: Deploy and Test

1. **Trigger deployment**:
   - Push changes to GitHub (if using GitHub deployment)
   - Or use `railway up` (if using CLI)

2. **Monitor deployment**:
   - Check the "Deployments" tab for build logs
   - Look for any errors in the build process

3. **Test your application**:
   - Railway will provide a public URL (like `your-app.railway.app`)
   - Visit the URL to test your application
   - Check that the database connection works
   - Test H5P content creation and video upload

## Health Check Endpoint

Your app includes a health check at `GET /health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check the deployment logs in Railway dashboard
   - Ensure all dependencies are in `package.json`
   - Verify Dockerfile.railway is correctly configured

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is set in environment variables
   - Check that PostgreSQL service is running
   - Review database configuration in `backend/config/database.js`

3. **Static File Issues**:
   - Ensure frontend builds successfully
   - Check that `public/frontend` directory is created
   - Verify Express static file serving is configured

4. **CORS Issues**:
   - Check that Railway domains are allowed in CORS configuration
   - Update `backend/server.js` if needed

### Useful Railway Commands:

```bash
# Check deployment status
railway status

# View logs
railway logs

# Open your deployed app
railway open

# Connect to database
railway connect postgresql
```

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Pushed all code to GitHub
- [ ] Verified `Dockerfile.railway` exists and is configured
- [ ] Checked `start-railway.sh` is executable
- [ ] Confirmed `.railwayignore` excludes unnecessary files
- [ ] Updated CORS settings in `backend/server.js`
- [ ] Set up PostgreSQL database on Railway
- [ ] Configured all required environment variables
- [ ] Tested locally with PostgreSQL connection

## Project Structure for Railway

Your project should have this structure for Railway deployment:

```
itp-h5p/
├── Dockerfile.railway          # Railway Dockerfile ✅
├── start-railway.sh           # Railway startup script ✅
├── .railwayignore            # Files to ignore ✅
├── package.json              # Root package.json ✅
├── backend/                  # Backend application ✅
│   ├── server.js            # Updated with CORS ✅
│   ├── config/database.js   # Railway PostgreSQL config ✅
│   └── ...
├── frontend/                 # React frontend ✅
└── railway-setup.md         # This guide ✅
```

## Security Notes

- Keep your JWT and session secrets secure
- Use environment variables for all sensitive data
- Consider enabling Railway's automatic HTTPS
- Monitor your application logs regularly

## Cost Considerations

- Railway offers a generous free tier
- Monitor your usage in the Railway dashboard
- Consider upgrading if you exceed free limits

## Final Steps

1. **Test your deployment**: Visit your Railway URL and verify all features work
2. **Monitor performance**: Check Railway dashboard for metrics
3. **Set up custom domain** (optional): Configure a custom domain in Railway settings

Your H5P Interactive Video Platform is now ready for Railway deployment! 🚀
