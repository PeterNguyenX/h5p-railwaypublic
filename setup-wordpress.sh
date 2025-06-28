#!/bin/bash

# WordPress Setup Script for H5P Integration
# This script will download and configure WordPress alongside your existing application

echo "🚀 Starting WordPress setup for H5P Integration..."

# Variables
WORDPRESS_DIR="wp"
DB_NAME="wordpress_db"
DB_USER="wordpress_user"
DB_PASS="your_secure_password"
SITE_URL="http://localhost/wp"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create WordPress directory
echo "📁 Creating WordPress directory..."
if [ ! -d "$WORDPRESS_DIR" ]; then
    echo "⬇️ Downloading WordPress..."
    curl -O https://wordpress.org/latest.tar.gz
    tar -xzf latest.tar.gz
    mv wordpress $WORDPRESS_DIR
    rm latest.tar.gz
    echo "✅ WordPress downloaded and extracted"
else
    echo "⚠️ WordPress directory already exists"
fi

# Setup WordPress configuration
echo "⚙️ Configuring WordPress..."
cd $WORDPRESS_DIR

if [ ! -f "wp-config.php" ]; then
    cp wp-config-sample.php wp-config.php
    
    # Configure database settings
    sed -i.bak "s/database_name_here/$DB_NAME/g" wp-config.php
    sed -i.bak "s/username_here/$DB_USER/g" wp-config.php
    sed -i.bak "s/password_here/$DB_PASS/g" wp-config.php
    sed -i.bak "s/localhost/localhost/g" wp-config.php
    
    # Generate salts
    SALTS=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
    SEARCH="put your unique phrase here"
    
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
    rm salts.tmp
    
    echo "✅ WordPress configuration created"
else
    echo "⚠️ wp-config.php already exists"
fi

cd ..

# Copy H5P plugin
echo "🔌 Installing H5P plugin..."
if [ -d "h5p" ]; then
    mkdir -p $WORDPRESS_DIR/wp-content/plugins
    cp -r h5p $WORDPRESS_DIR/wp-content/plugins/
    echo "✅ H5P plugin copied to WordPress"
else
    echo "⚠️ H5P plugin directory not found"
fi

# Create database
echo "🗄️ Setting up database..."
if command -v mysql &> /dev/null; then
    echo "Please enter your MySQL root password:"
    mysql -u root -p < create_wordpress_db.sql
    echo "✅ Database created"
else
    echo "⚠️ MySQL not found. Please install MySQL or create the database manually"
fi

# Create WordPress .htaccess
echo "📝 Creating .htaccess file..."
cat > $WORDPRESS_DIR/.htaccess << 'EOF'
# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /wp/
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /wp/index.php [L]
</IfModule>
# END WordPress
EOF

# Set permissions
echo "🔐 Setting file permissions..."
find $WORDPRESS_DIR -type d -exec chmod 755 {} \;
find $WORDPRESS_DIR -type f -exec chmod 644 {} \;
chmod 600 $WORDPRESS_DIR/wp-config.php

echo ""
echo "🎉 WordPress setup complete!"
echo ""
echo "Next steps:"
echo "1. Start your PHP server (if not already running)"
echo "2. Visit $SITE_URL to complete WordPress installation"
echo "3. Login to WordPress admin and activate the H5P plugin"
echo "4. Configure H5P settings to work with your existing content"
echo ""
echo "WordPress admin will be available at: $SITE_URL/wp-admin/"
