# Step-by-Step Deployment Instructions

## 🚀 Deploy Your H5P Interactive Video Platform to Fly.io

### Step 1: Login to Fly.io
```bash
fly auth login
```
This will open a browser window for you to log in or create a Fly.io account.

### Step 2: Push Your Code to GitHub
If you haven't already, make sure your code is on GitHub:
```bash
# Check if you have a remote repository
git remote -v

# If no remote, add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push your code
git push -u origin main
```

### Step 3: Build Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 4: Deploy to Fly.io
You have two options:

#### Option A: Use the Automated Script (Recommended)
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Option B: Manual Deployment
```bash
# Create the app
fly apps create h5p-interactive-video

# Create persistent volumes
fly volumes create h5p_uploads --size 5 --region sjc
fly volumes create h5p_content --size 1 --region sjc

# Set environment variables
fly secrets set NODE_ENV=production JWT_SECRET=$(openssl rand -base64 32)

# Deploy
fly deploy
```

### Step 5: Access Your App
After deployment, your app will be available at:
https://h5p-interactive-video.fly.dev

### Troubleshooting the "Failed to load latest GitHub commit" Error

This error typically occurs when:

1. **Git repository is not properly set up**
   - Make sure you've committed all your changes
   - Push to GitHub before deploying

2. **GitHub repository is private without proper access**
   - Make sure the repository is public, or
   - Configure deployment keys if private

3. **Fly.io can't access your repository**
   - Check repository permissions
   - Ensure the repository URL is correct

### Quick Fix Commands:
```bash
# Make sure everything is committed
git add .
git commit -m "Deployment ready"

# Push to GitHub
git push origin main

# Try deployment again
fly deploy
```

### Next Steps After Deployment:

1. **Test your app**: Visit https://h5p-interactive-video.fly.dev
2. **Monitor logs**: `fly logs` to check for any issues
3. **Scale if needed**: `fly scale memory 2048` for more resources
4. **Set up custom domain**: `fly certs add yourdomain.com`

### Common Commands:
- `fly status` - Check app status
- `fly logs` - View application logs
- `fly ssh console` - SSH into your app
- `fly scale memory 2048` - Increase memory
- `fly restart` - Restart your app

### Need Help?
- Check the DEPLOY_GUIDE.md for detailed instructions
- View logs with `fly logs` if something goes wrong
- Contact support through Fly.io community forum
