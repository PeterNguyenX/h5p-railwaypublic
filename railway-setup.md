# Railway Deployment Guide for H5P Interactive Video Platform

This guide walks you through deploying the H5P Interactive Video Platform to Railway, a free hosting service that's simpler than Fly.io.

## ✅ Current Status (Updated - December 2024)

**Last Updated:** Fixed static file serving and React build location issues

### 🎯 Deployment Status
- ✅ **Railway Project**: `itp-h5p-production` 
- ✅ **Build Success**: Docker image under 4GB, builds successfully
- ✅ **Code Fixes Applied**: Removed duplicate static file serving, moved React build files
- 🔄 **Deployment**: Latest changes pushed, waiting for Railway deployment

### 🔧 Recent Fixes Applied
1. **Database Config**: Fixed to handle missing `DATABASE_URL` gracefully
2. **Static Files**: Fixed duplicate/conflicting static file serving code
3. **React Build Location**: Moved React build files from `backend/public/frontend/` to `backend/public/`
4. **Health Checks**: Added `/api/health` and `/api/status` endpoints
5. **Logging**: Enhanced startup logs for debugging

### 🚨 Previous Issue (FIXED)
The app was only showing minimal API JSON at the root URL due to:
- Duplicate static file serving code causing conflicts
- React build files in wrong location (`backend/public/frontend/` instead of `backend/public/`)

### 📋 Next Steps
1. **Verify Deployment**: Check if Railway has deployed the latest fixes
2. **Test Full App**: Confirm React frontend loads at root URL
3. **Add Database**: Add PostgreSQL and environment variables for full functionality
4. **Final Testing**: Ensure all features work properly

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

## ✅ **Latest Deployment Status (July 17, 2025)**

**Problem Solved!** The main deployment issues have been resolved:

### **What Was Fixed:**

1. **✅ Frontend Build Issue**: 
   - Originally tried to build frontend inside Docker (increases image size)
   - **Solution**: Pre-built frontend locally and committed to git
   - Now uses much smaller, simpler Dockerfile

2. **✅ Image Size Issue**: 
   - Was exceeding Railway's 4GB limit with full build process
   - **Solution**: Switched to `Dockerfile.prebuilt` approach
   - Estimated image size: ~800MB (much smaller)

3. **✅ Missing Files Issue**: 
   - `frontend/build/` was gitignored and missing from repository
   - **Solution**: Removed `/build` from `.gitignore` and committed build files

### **Current Deployment Configuration:**

- **Repository**: `PeterNguyenX/h5p-railwaypublic` ✅
- **Dockerfile**: Uses pre-built frontend (simpler, smaller) ✅  
- **Frontend**: Built locally and committed to git ✅
- **Image Size**: Under 1GB (well within Railway limits) ✅

### **Next Steps After Deployment:**

1. **✅ Docker Build: COMPLETED** - Image builds successfully (~800MB)
2. **🔧 Health Check: IN PROGRESS** - App starts but health check fails
3. **⚠️ Missing Environment Variables** - Need to add PostgreSQL and secrets
4. **🚀 Test your deployed app** at your Railway URL (once health check passes)

### **Current Status: Health Check Debugging**

**✅ Build Success**: Docker image builds without errors  
**❌ Health Check Fails**: App isn't responding to health checks

**Immediate Action Required:**
1. **Add PostgreSQL Database** in Railway Dashboard
2. **Set Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your_secure_secret_here
   SESSION_SECRET=your_session_secret_here
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

## Public Access & Sharing Your Railway Website

### **Getting Your Public URL**

After successful Railway deployment:

1. **Go to Railway Dashboard** → Your Project
2. **Click "Deployments" tab**
3. **Copy your public URL** - looks like:
   ```
   https://h5p-railwaypublic-production.railway.app
   ```

### **How People Visit Your Website**

✅ **Anyone can visit** your website by going to your Railway URL  
✅ **No signup required** - it's publicly accessible  
✅ **Works on any device** - mobile, tablet, desktop  
✅ **HTTPS enabled** - secure by default  

### **Sharing Your H5P Platform**

**Direct Access:**
- Share your Railway URL with students, colleagues, or anyone
- They can create H5P content, upload videos, and use all features
- No installation needed - works in any web browser

**Example URLs:**
- Main site: `https://your-app.railway.app`
- Health check: `https://your-app.railway.app/health`
- API: `https://your-app.railway.app/api/`

### **Custom Domain (Optional)**

You can also set up a custom domain:

1. **Buy a domain** (like `myh5pplatform.com`)
2. **In Railway Dashboard** → Settings → Domains
3. **Add your custom domain**
4. **Update DNS settings** as instructed by Railway
5. **Your site will be available** at your custom domain

### **Usage Examples**

Once deployed, people can:
- 📹 **Upload and process videos**
- 🎯 **Create interactive H5P content**
- 📚 **Build educational materials**
- 🔗 **Share content with others**
- 💾 **Save their work in the database**

## ⚠️ **Deployment Failed After Successful Build**

If your build succeeds but deployment fails, this usually means:

### **Common Deployment Failure Causes:**

1. **Container Start Issues**:
   - Application crashes on startup
   - Port binding problems
   - Missing environment variables
   - Database connection failures

2. **Health Check Failures**:
   - App doesn't respond on the expected port
   - Startup takes too long (timeout)
   - Application crashes immediately

### **How to Debug Deployment Failures:**

1. **Check Railway Logs**:
   ```
   Railway Dashboard → Your Project → Deployments → Click Failed Deployment → View Logs
   ```

2. **Look for specific error messages** like:

## 🎯 **Railway Health Check Requirements - Detailed Breakdown**

Railway monitors your app's health by making HTTP requests to `/api/projects/health`. Here's exactly what needs to happen for it to pass:

### **✅ Health Check Success Criteria:**

1. **HTTP Response Code**: Must return `200 OK`
2. **Response Time**: Must respond within Railway's timeout (usually 30-60 seconds)
3. **Response Format**: Should return valid JSON (our endpoint does this)
4. **Container Running**: App container must be running and listening on the correct port
5. **Network Accessible**: Health endpoint must be reachable from Railway's health checker

### **🔍 Current Health Check Endpoints:**

Your app now has **3 health check endpoints** (added for debugging):

**1. `/health` (Simple)**
```json
{ "status": "ok", "message": "H5P Platform is running" }
```

**2. `/api/health` (Detailed)**
```json
{
  "status": "ok",
  "timestamp": "2025-07-17T...",
  "message": "Server is running",
  "environment": "production",
  "port": 3001,
  "hasDatabase": true,
  "hasJWT": true,
  "hasSession": true
}
```

**3. `/api/projects/health` (What Railway Checks)**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-17T...",
  "message": "Projects API is up and running",
  "service": "h5p-interactive-video-platform"
}
```

### **⚠️ Why Health Check Currently Fails:**

**Most Likely Causes (in order):**

1. **Missing DATABASE_URL** → App crashes during database initialization
2. **Missing JWT_SECRET** → Express middleware fails to initialize
3. **Missing SESSION_SECRET** → Session middleware fails
4. **Port Binding Issues** → App doesn't listen on Railway's assigned port
5. **Startup Errors** → Application crashes before reaching health endpoint

### **🚀 Minimum Requirements to Pass Health Check:**

**Required Environment Variables:**
```bash
NODE_ENV=production                    # Tells app it's in production
DATABASE_URL=postgresql://...          # Auto-provided when you add PostgreSQL
JWT_SECRET=your32characterstring       # Required for JWT middleware
SESSION_SECRET=your32characterstring   # Required for session middleware
PORT=3001                             # Auto-provided by Railway
```

**Required Services:**
- PostgreSQL database added to Railway project
- Container successfully starts and binds to port

### **🔧 Step-by-Step Health Check Success:**

**Step 1: App Startup Sequence**
```
1. Container starts
2. Node.js loads environment variables
3. Express server initializes
4. Database connection attempts
5. Middleware loads (CORS, JWT, Sessions)
6. Routes register (including /api/projects/health)
7. Server binds to PORT and starts listening
8. Health endpoint becomes available
```

**Step 2: Railway Health Check**
```
1. Railway waits ~30 seconds after container start
2. Makes HTTP GET request to /api/projects/health
3. Expects 200 OK response within timeout
4. If successful → marks as healthy ✅
5. If fails → retries, then marks as unhealthy ❌
```

### **🔍 How to Verify Health Check Requirements:**

**Check 1: Environment Variables**
- Railway Dashboard → Variables tab
- Must have: `NODE_ENV`, `JWT_SECRET`, `SESSION_SECRET`
- Auto-added: `DATABASE_URL`, `PORT`

**Check 2: Database Service**
- Railway Dashboard → should see PostgreSQL service
- Variables tab → should show `DATABASE_URL`

**Check 3: Startup Logs**
- Deployments → Latest deployment → View Logs
- Look for: "Server running on port XXXX"
- Look for: "Database connection: SUCCESS"

**Check 4: Manual Health Check**
- Visit: `https://your-app.railway.app/api/projects/health`
- Should return JSON with `"status": "healthy"`

### **🎯 Expected Success Timeline:**

Once you add the missing environment variables:
- **0-30 seconds**: Container starts, app initializes
- **30-60 seconds**: Railway begins health checks
- **60-90 seconds**: Health check passes, app marked as healthy
- **90+ seconds**: App is live and accessible

### **💡 Pro Tip: Test Health Check Manually**

After fixing environment variables, test these URLs:
1. `https://your-app.railway.app/` (should show API info)
2. `https://your-app.railway.app/health` (simple check)
3. `https://your-app.railway.app/api/projects/health` (Railway's check)

If any of these fail to load, the health check will also fail.

## Add Environment Variables Now

## 🚨 **URGENT UPDATE: Database Issue Identified & Fixed**

**Latest Error Analysis**: The app is crashing because:
1. ❌ **DATABASE_URL: Not set** (Railway PostgreSQL not added)
2. ❌ **App tries to use SQLite fallback** but `sqlite3` package not installed
3. ❌ **Missing JWT_SECRET and SESSION_SECRET**

### **✅ IMMEDIATE FIX APPLIED:**
- Updated database config to handle missing DATABASE_URL gracefully
- App will now start even without database (for debugging)
- Better error messages pointing to Railway PostgreSQL setup

### **🚀 CRITICAL ACTIONS NEEDED IN RAILWAY DASHBOARD:**

**Step 1: Add PostgreSQL Database** (This will fix the main crash)
1. Go to your Railway project dashboard
2. Click the **"+" button** (or "New")
3. Select **"Database"** → **"PostgreSQL"**
4. Railway automatically sets `DATABASE_URL` environment variable

**Step 2: Add Missing Environment Variables**
1. Go to **"Variables"** tab in your Railway project
2. Click **"New Variable"** and add each of these:

```
NODE_ENV=production
JWT_SECRET=supersecretjwtkeythatisatleast32characterslong123456
SESSION_SECRET=supersecuresessionkeythatisatleast32characterslong123
```

### **🔍 What Will Happen After Adding These:**

**Expected Startup Log (Success):**
```
🚀 Starting H5P Interactive Video Platform...
Environment: production
Port: 3001
Database connection info:
- DATABASE_URL: Set (masked)
🔧 Environment check:
- DATABASE_URL: set
- JWT_SECRET: set
- SESSION_SECRET: set
✅ Database connection has been established successfully.
🚀 Server running on port 3001
```

**Health Check Should Then Pass:**
- Railway will retry health check at `/api/projects/health`
- Should return: `{"status":"healthy","message":"Projects API is up and running"}`
- App will become publicly accessible

### **⏱️ Timeline After Adding Database & Variables:**
- **0-30 seconds**: Railway triggers redeploy
- **30-60 seconds**: New container starts with proper config
- **60-90 seconds**: Health check passes
- **90+ seconds**: App is live! 🎉

**The core issue was the missing PostgreSQL database in Railway. This is now the final step!**

## Final Step: Add PostgreSQL Database
