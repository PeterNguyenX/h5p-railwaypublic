#!/bin/bash

# MAMP WordPress Setup Script for H5P Integration
# This script will set up WordPress with MAMP for your H5P platform

echo "🚀 Setting up WordPress with MAMP for H5P Integration..."

# Variables
MAMP_HTDOCS="/Applications/MAMP/htdocs"
WP_DIR="h5p-wp"
DB_NAME="h5p_wordpress"
DB_USER="root"
DB_PASS="root"
DB_HOST="localhost:3306"
WP_URL="http://localhost:8888/$WP_DIR"

# Check if MAMP is installed
if [ ! -d "/Applications/MAMP" ]; then
    echo "❌ MAMP is not installed. Please install MAMP from https://www.mamp.info/"
    echo "📝 After installing MAMP:"
    echo "   - Start MAMP"
    echo "   - Set Apache port to 8080"
    echo "   - Set MySQL port to 3306"
    echo "   - Then run this script again"
    exit 1
fi

# Check if MAMP is running
if ! lsof -i :8888 | grep -q LISTEN; then
    echo "⚠️ MAMP Apache doesn't seem to be running on port 8888"
    echo "Please start MAMP and ensure Apache is running"
    echo "💡 MAMP's default Apache port is 8888, MySQL port is 3306"
    read -p "Press Enter when MAMP is running..."
fi

# Create WordPress directory in MAMP htdocs
echo "📁 Setting up WordPress in MAMP..."
cd "$MAMP_HTDOCS" || exit 1

if [ ! -d "$WP_DIR" ]; then
    echo "⬇️ Downloading WordPress..."
    curl -O https://wordpress.org/latest.tar.gz
    tar -xzf latest.tar.gz
    mv wordpress "$WP_DIR"
    rm latest.tar.gz
    echo "✅ WordPress downloaded and extracted to $MAMP_HTDOCS/$WP_DIR"
else
    echo "⚠️ WordPress directory already exists at $MAMP_HTDOCS/$WP_DIR"
fi

# Setup WordPress configuration
echo "⚙️ Configuring WordPress..."
cd "$WP_DIR" || exit 1

if [ ! -f "wp-config.php" ]; then
    cp wp-config-sample.php wp-config.php
    
    # Configure database settings for MAMP
    sed -i.bak "s/database_name_here/$DB_NAME/g" wp-config.php
    sed -i.bak "s/username_here/$DB_USER/g" wp-config.php
    sed -i.bak "s/password_here/$DB_PASS/g" wp-config.php
    sed -i.bak "s/localhost/$DB_HOST/g" wp-config.php
    
    # Generate salts
    SALTS=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
    
    # Create a temporary file with the salts
    echo "$SALTS" > salts.tmp
    
    # Replace the salt lines in wp-config.php
    awk '
    /put your unique phrase here/ && ++count <= 8 {
        if (count == 1) {
            while ((getline line < "salts.tmp") > 0) {
                print line
            }
            close("salts.tmp")
            next
        } else {
            next
        }
    }
    { print }
    ' wp-config.php > wp-config-new.php
    
    mv wp-config-new.php wp-config.php
    rm salts.tmp wp-config.php.bak
    
    echo "✅ WordPress configuration created for MAMP"
else
    echo "⚠️ wp-config.php already exists"
fi

# Copy H5P plugin
echo "🔌 Installing H5P plugin..."
H5P_SOURCE="/Users/peternguyen/Downloads/itp-h5p/h5p"
if [ -d "$H5P_SOURCE" ]; then
    mkdir -p wp-content/plugins
    cp -r "$H5P_SOURCE" wp-content/plugins/
    echo "✅ H5P plugin copied to WordPress"
else
    echo "⚠️ H5P plugin directory not found at $H5P_SOURCE"
fi

# Create .htaccess for pretty permalinks
echo "📝 Creating .htaccess file..."
cat > .htaccess << 'EOF'
# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /h5p-wp/
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /h5p-wp/index.php [L]
</IfModule>
# END WordPress
EOF

# Set proper permissions
echo "🔐 Setting file permissions..."
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;

# Create database via command line (if MySQL is accessible)
echo "🗄️ Setting up database..."
if command -v mysql &> /dev/null; then
    echo "Creating database $DB_NAME..."
    mysql -h 127.0.0.1 -P 3306 -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
        echo "⚠️ Could not create database automatically. Please create it manually:"
        echo "   1. Go to http://localhost:8080/phpMyAdmin"
        echo "   2. Create database named: $DB_NAME"
        echo "   3. Set charset to utf8mb4_unicode_ci"
    }
else
    echo "⚠️ MySQL command not found. Please create database manually:"
    echo "   1. Go to http://localhost:8888/phpMyAdmin"
    echo "   2. Create database named: $DB_NAME"
    echo "   3. Set charset to utf8mb4_unicode_ci"
fi

echo ""
echo "🎉 MAMP WordPress setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Ensure MAMP is running (Apache on port 8888, MySQL on port 3306)"
echo "2. Create database if not done automatically:"
echo "   - Visit: http://localhost:8888/phpMyAdmin"
echo "   - Create database: $DB_NAME"
echo "3. Complete WordPress installation:"
echo "   - Visit: $WP_URL"
echo "   - Follow the installation wizard"
echo "4. Login to WordPress admin and activate H5P plugin:"
echo "   - Visit: $WP_URL/wp-admin"
echo "   - Go to Plugins > Activate H5P"
echo ""
echo "🔗 Important URLs:"
echo "   WordPress Site: $WP_URL"
echo "   WordPress Admin: $WP_URL/wp-admin"
echo "   phpMyAdmin: http://localhost:8888/phpMyAdmin (redirects to phpMyAdmin5)"
echo "   MAMP Start Page: http://localhost:8888/MAMP"
echo ""
echo "⚙️ MAMP Configuration:"
echo "   Apache Port: 8888"
echo "   MySQL Port: 3306"
echo "   Document Root: $MAMP_HTDOCS"
