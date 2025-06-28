# WordPress Integration for H5P Platform

This guide explains how to integrate WordPress with your H5P Interactive Content Platform to enable WordPress plugin functionality.

## Quick Setup

### Option 1: Docker Compose (Recommended)

The easiest way to set up WordPress alongside your existing application:

1. **Start all services with Docker Compose:**
```bash
docker-compose up -d
```

This will start:
- MySQL database (port 3306)
- WordPress (port 8080) 
- Your Node.js backend (port 5000)
- Nginx reverse proxy (port 80)

2. **Access WordPress setup:**
- Visit: http://localhost:8080
- Complete the WordPress installation wizard
- Create an admin account

3. **Activate H5P Plugin:**
- Login to WordPress admin: http://localhost:8080/wp-admin
- Go to Plugins > Installed Plugins
- Activate the H5P plugin

### Option 2: Manual Installation

1. **Run the setup script:**
```bash
./setup-wordpress.sh
```

2. **Install PHP (if not already installed):**
```bash
# macOS with Homebrew
brew install php mysql

# Start services
brew services start mysql
brew services start php
```

3. **Create database:**
```bash
mysql -u root -p < create_wordpress_db.sql
```

4. **Configure web server:**
Update your nginx configuration or use the provided docker-compose setup.

## Integration Features

### 1. WordPress REST API Integration

Your React app can now communicate with WordPress:

```javascript
// Get WordPress posts
const posts = await fetch('/api/wordpress/posts').then(r => r.json());

// Create a new post
const newPost = await fetch('/api/wordpress/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'My Post', content: 'Post content' })
});
```

### 2. H5P Content Synchronization

Sync H5P content between your Node.js app and WordPress:

```javascript
// Sync H5P content to WordPress
const syncedContent = await fetch('/api/wordpress/h5p/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(localH5PContent)
});
```

### 3. WordPress Integration Page

Access the WordPress integration features in your React app:
- Visit: http://localhost:3000/wordpress
- View WordPress posts
- Create new posts
- Sync H5P content

## Available Endpoints

### WordPress API Endpoints (via your Node.js backend)

- `GET /api/wordpress/posts` - Get WordPress posts
- `POST /api/wordpress/posts` - Create new post
- `GET /api/wordpress/h5p` - Get H5P content from WordPress
- `GET /api/wordpress/h5p/:id` - Get specific H5P content
- `POST /api/wordpress/h5p` - Create H5P content in WordPress
- `POST /api/wordpress/h5p/sync` - Sync H5P content
- `POST /api/wordpress/media` - Upload media to WordPress
- `POST /api/wordpress/auth` - Authenticate with WordPress

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
WORDPRESS_URL=http://localhost:8080
WORDPRESS_USER=your_wp_username
WORDPRESS_PASSWORD=your_wp_password
```

### Database Configuration

WordPress will use the same MySQL instance as your main application:

- Database: `wordpress_db`
- User: `wordpress_user`
- Password: `your_secure_password`

## WordPress Plugin Development

Your H5P plugin is automatically installed. To customize it:

1. **Plugin files location:**
```
h5p/
├── h5p.php                     # Main plugin file
├── admin/                      # Admin interface
├── h5p-php-library/           # H5P PHP library
└── h5p-editor-php-library/    # H5P Editor library
```

2. **Adding custom functionality:**
Edit the plugin files in the `h5p/` directory to add custom features.

## Common WordPress Plugins for H5P

You can install additional WordPress plugins to extend functionality:

1. **JWT Authentication for WP REST API** - For secure API access
2. **WP REST API Cache** - For better performance
3. **WP File Manager** - For easier file management
4. **Custom Post Type UI** - For custom content types

## Troubleshooting

### WordPress not accessible
- Check if Docker containers are running: `docker-compose ps`
- Verify port 8080 is not in use: `lsof -i :8080`

### Database connection issues
- Ensure MySQL is running
- Check database credentials in wp-config.php
- Verify database exists: `SHOW DATABASES;`

### H5P plugin not working
- Check file permissions in wp-content/plugins/h5p/
- Verify H5P libraries are properly installed
- Check WordPress error logs

### CORS issues
- Update CORS settings in your Node.js backend
- Add WordPress domain to allowed origins

## Next Steps

1. **Custom Theme Development:** Create a WordPress theme that matches your React app design
2. **Single Sign-On:** Implement SSO between your app and WordPress
3. **Content Synchronization:** Set up automated sync between systems
4. **Performance Optimization:** Implement caching and CDN integration

## Support

For WordPress-specific issues:
- Check WordPress documentation: https://wordpress.org/support/
- H5P documentation: https://h5p.org/documentation

For integration issues:
- Check your application logs
- Verify API endpoints are working
- Test WordPress REST API directly
