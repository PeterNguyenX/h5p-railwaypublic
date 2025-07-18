# How to Change Railway Project Name and URL

## Current URL (with "minimal")
❌ https://h5p-minimal-app-production.up.railway.app

## Desired URL (without "minimal")
✅ https://h5p-interactive-video-platform.up.railway.app
✅ https://h5p-platform-production.up.railway.app
✅ https://h5p-video-platform.up.railway.app

## Steps to Change Railway Project Name

### Option 1: Change Project Name in Railway Dashboard
1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Login to your account

2. **Navigate to Your Project**
   - Find your current project: `h5p-minimal-app-production`
   - Click on it to open

3. **Change Project Name**
   - Click on the project name at the top
   - Or go to "Settings" → "General"
   - Change the project name from `h5p-minimal-app-production` to:
     - `h5p-interactive-video-platform`
     - `h5p-platform-production`
     - `h5p-video-platform`
     - Or any name you prefer

4. **Save Changes**
   - Railway will automatically update the URL
   - The new URL will be: `https://[new-name].up.railway.app`

### Option 2: Create New Project (Clean Start)
1. **Create New Railway Project**
   - Go to Railway dashboard
   - Click "Deploy Now"
   - Connect your GitHub repository again
   - Choose a better name like `h5p-interactive-platform`

2. **Configure New Project**
   - Set the same environment variables
   - Add PostgreSQL database if needed
   - Deploy from your GitHub repository

3. **Delete Old Project**
   - Once new project is working, delete the old "minimal" one

## Recommended New Names
- `h5p-interactive-platform`
- `h5p-video-platform`
- `h5p-content-creator`
- `h5p-learning-platform`
- `interactive-video-platform`

## After Name Change
- Update any documentation with the new URL
- Test the new URL to ensure it works
- Update any bookmarks or references

## Note
The name change is cosmetic - all your code and functionality will remain the same. Only the URL will change to better reflect that this is a full-featured H5P platform, not a minimal app.
