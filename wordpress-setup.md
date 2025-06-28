# WordPress Integration Setup Guide

## Overview
This guide will help you integrate WordPress with your existing H5P Interactive Content Platform to enable WordPress plugin functionality.

## Setup Options

### Option 1: MAMP Setup (Recommended for macOS)

MAMP provides an easy-to-use local server environment with Apache, MySQL, and PHP.

1. **Install MAMP**
   - Download MAMP from https://www.mamp.info/
   - Install MAMP (free version is sufficient)
   - Start MAMP and ensure Apache and MySQL are running

2. **Configure MAMP Settings**
   - Open MAMP preferences
   - Set Apache Port to 8888 (MAMP's default) or 8080 (if you prefer)
   - Set MySQL Port to 3306
   - Set Document Root to `/Applications/MAMP/htdocs`
   - Note: MAMP defaults to Apache port 8888 and MySQL port 3306

3. **Download WordPress to MAMP**
```bash
cd /Applications/MAMP/htdocs
curl -O https://wordpress.org/latest.tar.gz
tar -xzf latest.tar.gz
mv wordpress h5p-wp
rm latest.tar.gz
```

4. **Create Database in MAMP**
   - Open phpMyAdmin: http://localhost:8888/phpMyAdmin (redirects to phpMyAdmin5)
   - Create new database named `h5p_wordpress`
   - Note: Default MAMP MySQL user is `root` with password `root`

5. **Configure WordPress**
```bash
cd /Applications/MAMP/htdocs/h5p-wp
cp wp-config-sample.php wp-config.php
```

Edit `wp-config.php`:
```php
define('DB_NAME', 'h5p_wordpress');
define('DB_USER', 'root');
define('DB_PASSWORD', 'root');
define('DB_HOST', 'localhost:3306');
```

6. **Install H5P Plugin**
```bash
# Copy your H5P plugin to WordPress
cp -r /Users/peternguyen/Downloads/itp-h5p/h5p /Applications/MAMP/htdocs/h5p-wp/wp-content/plugins/
```

7. **Complete WordPress Setup**
   - Visit: http://localhost:8888/h5p-wp
   - Follow WordPress installation wizard
   - Login to admin and activate H5P plugin

### Option 2: Docker Setup

Use Docker Compose for a containerized environment (see docker-compose.yml).

### Option 3: Manual Installation

Install WordPress in a subdirectory with manual PHP/MySQL setup.

## Database Setup

1. **Create MySQL Database**
```bash
mysql -u root -p < create_wordpress_db.sql
```

2. **Import WordPress Tables**
After WordPress installation, the tables will be created automatically.

## H5P Plugin Integration

1. **Copy H5P Plugin**
```bash
cp -r h5p wp/wp-content/plugins/
```

2. **Activate Plugin**
- Login to WordPress admin
- Go to Plugins > Installed Plugins
- Activate H5P plugin

## Nginx Configuration

Update your nginx configuration to handle both your existing app and WordPress:

```nginx
server {
    listen 80;
    server_name localhost;
    
    # Your existing React app
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # WordPress installation
    location /wp {
        alias /Users/peternguyen/Downloads/itp-h5p/wp;
        index index.php index.html;
        
        location ~ \.php$ {
            fastcgi_pass 127.0.0.1:9000;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }
    
    # Your existing backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Integration Points

### 1. WordPress REST API Integration
You can integrate WordPress content into your React app:

```javascript
// In your React components
const fetchWordPressContent = async () => {
    const response = await fetch('/wp/wp-json/wp/v2/posts');
    const posts = await response.json();
    return posts;
};
```

### 2. H5P Content Sharing
Configure H5P to work between your Node.js backend and WordPress:

- Use the same H5P content directory
- Share H5P libraries between both systems
- Implement content synchronization

## Next Steps

1. Install WordPress
2. Configure database connection
3. Install and activate H5P plugin
4. Test integration
5. Configure content sharing between systems
