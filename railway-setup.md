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

## Railway Deployment Errors & Quick Fixes

### **Error: "Failed to deploy from source"**

**Most Common Causes:**

1. **Railway not using Dockerfile**: 
   - Ensure `railway.json` specifies `"builder": "DOCKERFILE"`
   - Set `"dockerfilePath": "Dockerfile.railway"`

2. **Missing Node.js scripts**:
   - Verify root `package.json` has `"start"` and `"build"` scripts
   - Check that frontend/backend have their own package.json files

3. **Build process failing**:
   - Frontend build errors (missing dependencies)
   - Backend dependencies not installing correctly
   - Path issues in Dockerfile

**Quick Fix Steps:**

1. **Check Railway.json Configuration** ✅:
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "DOCKERFILE",
       "dockerfilePath": "Dockerfile.railway"
     },
     "deploy": {
       "startCommand": "./start-railway.sh"
     }
   }
   ```

2. **Verify Files Exist** ✅:
   - `Dockerfile.railway`
   - `start-railway.sh` (executable)
   - `railway.json`
   - `.railwayignore`

3. **Check in Railway Dashboard**:
   - Go to Settings → Build & Deploy
   - Ensure "Build method" is set to "Dockerfile"
   - Check that "Dockerfile path" is `Dockerfile.railway`

4. **Force Rebuild**:
   - Push a small change to GitHub
   - Or trigger manual deploy in Railway dashboard

### **Error: "Build failed" or "Container failed to start"**

**Solutions:**
- Check Railway build logs for specific error messages
- Verify all package.json dependencies are correct
- Ensure frontend builds successfully locally
- Check that environment variables are set

### **Error: "Repository is empty"**

This error occurs when Railway can't access your GitHub repository content.

**Solutions:**

1. **Verify Repository Selection in Railway**:
   - Go to Railway Dashboard
   - Delete current project if it exists
   - Click "New Project" → "Deploy from GitHub repo"
   - **Carefully select**: `nhvlinter/itp-h5p` (your exact repo name)
   - **Select branch**: `main` (not master)

2. **Check GitHub Repository Access**:
   - Ensure the repository is **public** (or Railway has permission)
   - Verify the repository actually contains files
   - Go to: https://github.com/nhvlinter/itp-h5p to confirm

3. **Reconnect GitHub Integration**:
   - In Railway: Settings → Integrations
   - Disconnect and reconnect GitHub
   - Try deploying again

4. **Alternative: Use Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   railway link  # Link to existing project
   railway up    # Deploy from local files
   ```

5. **Force Repository Refresh**:
   - Make a small change to any file
   - Commit and push to GitHub
   - This triggers Railway to recheck the repository

**Repository Status Verification**:
- Repository: `nhvlinter/itp-h5p` ✅
- Branch: `main` ✅ 
- Visibility: Public ✅
- Size: ~276MB ✅
- Files: 60+ files including Dockerfile, package.json ✅

### **Error: "Not the repository owner" / "Repository access denied"**

If you're not the owner of the repository, you need to create your own copy:

**Solution: Create Your Own Repository**

1. **Create New GitHub Repository**:
   - Go to GitHub.com → New repository
   - Name: `h5p-interactive-video` (or your choice)
   - Visibility: **Public** ✅
   - Don't initialize with README/gitignore

2. **Update Git Remote**:
   ```bash
   # Remove old remote
   git remote remove origin
   
   # Add your new repository (replace with your details)
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

3. **Use Your Repository in Railway**:
   - In Railway: Select YOUR repository
   - Repository: `YOUR_USERNAME/YOUR_REPO_NAME`
   - Branch: `main`

**Example for username 'PeterNguyenX':**
```bash
git remote remove origin
git remote add origin https://github.com/PeterNguyenX/h5p-railwaypublic.git
git push -u origin main
```

**Your Repository Details:**
- Repository: `PeterNguyenX/h5p-railwaypublic` ✅
- URL: https://github.com/PeterNguyenX/h5p-railwaypublic
- Branch: `main` ✅
- Visibility: Public ✅

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
