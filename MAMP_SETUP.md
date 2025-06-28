# MAMP WordPress Setup Guide

## 🎯 Using MAMP for WordPress Integration

MAMP (Mac, Apache, MySQL, PHP) is an excellent choice for local WordPress development on macOS. It provides a simple interface for managing your local server environment.

## 📋 Prerequisites

1. **Download and Install MAMP**
   - Visit: https://www.mamp.info/
   - Download the free version of MAMP
   - Install MAMP to `/Applications/MAMP`

## 🚀 Quick Setup

### Step 1: Configure MAMP

1. **Start MAMP**
   - Open MAMP from Applications
   - Click "Start Servers" button
   - Both Apache and MySQL should show green lights

2. **Configure Ports (Important!)**
   - Click "MAMP" > "Preferences" > "Ports"
   - Set Apache Port: `8080` (to avoid conflict with your React app on 3000)
   - Set MySQL Port: `3306`
   - Click "OK"

3. **Verify MAMP is Running**
   - Visit: http://localhost:8080/MAMP
   - You should see the MAMP start page

### Step 2: Automated WordPress Setup

Run the MAMP setup script:

```bash
cd /Users/peternguyen/Downloads/itp-h5p
./setup-wordpress-mamp.sh
```

This script will:
- Download WordPress to MAMP's htdocs directory
- Configure WordPress for MAMP's database
- Copy your H5P plugin
- Set up proper file permissions

### Step 3: Create Database

1. **Open phpMyAdmin**
   - Visit: http://localhost:8080/phpMyAdmin
   - Login with username: `root`, password: `root`

2. **Create Database**
   - Click "New" in the left sidebar
   - Database name: `h5p_wordpress`
   - Collation: `utf8mb4_unicode_ci`
   - Click "Create"

### Step 4: Complete WordPress Installation

1. **Visit Your WordPress Site**
   - Go to: http://localhost:8080/h5p-wp
   - Follow the WordPress installation wizard
   - Use these database settings:
     - Database Name: `h5p_wordpress`
     - Username: `root`
     - Password: `root`
     - Database Host: `localhost`

2. **Create WordPress Admin Account**
   - Choose your admin username and password
   - Complete the installation

3. **Activate H5P Plugin**
   - Go to: http://localhost:8080/h5p-wp/wp-admin
   - Navigate to Plugins > Installed Plugins
   - Activate the "H5P" plugin

## 🔧 Integration with Your App

### Update Environment Variables

Copy the MAMP environment file:

```bash
cd backend
cp .env.mamp .env
```

Or manually add these to your `.env` file:

```env
WORDPRESS_URL=http://localhost:8080/h5p-wp
WORDPRESS_USER=your_wp_admin_username
WORDPRESS_PASSWORD=your_wp_admin_password

DB_HOST=localhost
DB_PORT=3306
DB_NAME=h5p_wordpress
DB_USER=root
DB_PASSWORD=root
```

### Start Your Application

Use the MAMP-specific start command:

```bash
npm run start:mamp
```

This will:
1. Copy MAMP environment variables
2. Start your Node.js backend (port 5000)
3. Start your React frontend (port 3000)

## 🌐 Access Points

With MAMP setup, you'll have these URLs:

- **Your React App**: http://localhost:3000
- **WordPress Site**: http://localhost:8080/h5p-wp
- **WordPress Admin**: http://localhost:8080/h5p-wp/wp-admin
- **WordPress Integration Page**: http://localhost:3000/wordpress
- **phpMyAdmin**: http://localhost:8080/phpMyAdmin
- **MAMP Control Panel**: http://localhost:8080/MAMP

## 🔌 Benefits of Using MAMP

### ✅ Advantages

1. **Easy Setup**: One-click server start/stop
2. **GUI Interface**: Easy to manage through MAMP interface
3. **No Docker**: No need for Docker knowledge
4. **Local Development**: Perfect for local WordPress development
5. **Multiple PHP Versions**: Can switch PHP versions easily
6. **Real WordPress**: Full WordPress installation, not headless

### ⚠️ Things to Note

1. **Port Configuration**: Make sure Apache runs on 8080, not 80
2. **File Permissions**: WordPress files are in `/Applications/MAMP/htdocs/h5p-wp`
3. **Database Access**: Use phpMyAdmin for database management
4. **Plugin Development**: Direct access to WordPress plugin files

## 🛠️ Development Workflow

### Daily Workflow

1. **Start MAMP**
   - Open MAMP app
   - Click "Start Servers"

2. **Start Your Application**
   ```bash
   npm run start:mamp
   ```

3. **Develop**
   - Your React app: http://localhost:3000
   - WordPress admin: http://localhost:8080/h5p-wp/wp-admin
   - Integration testing: http://localhost:3000/wordpress

### File Locations

- **WordPress Installation**: `/Applications/MAMP/htdocs/h5p-wp/`
- **H5P Plugin**: `/Applications/MAMP/htdocs/h5p-wp/wp-content/plugins/h5p/`
- **WordPress Uploads**: `/Applications/MAMP/htdocs/h5p-wp/wp-content/uploads/`
- **Your App Backend**: `/Users/peternguyen/Downloads/itp-h5p/backend/`

## 🔧 Troubleshooting

### MAMP Won't Start

1. Check if ports 8080 and 3306 are free:
   ```bash
   lsof -i :8080
   lsof -i :3306
   ```

2. Kill conflicting processes:
   ```bash
   sudo lsof -t -i tcp:8080 | xargs kill -9
   sudo lsof -t -i tcp:3306 | xargs kill -9
   ```

### WordPress Connection Issues

1. Verify MAMP MySQL is running
2. Check database credentials in wp-config.php
3. Ensure database `h5p_wordpress` exists

### H5P Plugin Issues

1. Check plugin folder permissions:
   ```bash
   ls -la /Applications/MAMP/htdocs/h5p-wp/wp-content/plugins/
   ```

2. Reactivate plugin in WordPress admin

### Integration Issues

1. Check your `.env` file has correct MAMP URLs
2. Verify WordPress REST API is accessible:
   - Visit: http://localhost:8080/h5p-wp/wp-json/wp/v2/posts

## 🎯 Next Steps

1. **Install WordPress Plugins**: Add more functionality
2. **Theme Development**: Create custom WordPress themes
3. **Content Synchronization**: Set up automatic sync between systems
4. **Production Deployment**: Configure for production environment

## 📞 Support

- **MAMP Issues**: https://www.mamp.info/en/support/
- **WordPress Issues**: https://wordpress.org/support/
- **Integration Issues**: Check your application logs and API endpoints
