#!/bin/bash

# MySQL Password Fix Script for MAMP phpMyAdmin
echo "🔧 Fixing MySQL password for MAMP phpMyAdmin compatibility..."

echo "⚠️ This script will:"
echo "   1. Stop MySQL service"
echo "   2. Reset root password to 'root'"
echo "   3. Restart MySQL service"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled."
    exit 1
fi

echo "🛑 Stopping MySQL service..."
brew services stop mysql
sleep 2

echo "🔓 Starting MySQL in safe mode..."
sudo mysqld_safe --skip-grant-tables &
sleep 3

echo "🔑 Resetting root password..."
mysql -u root << EOF
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
FLUSH PRIVILEGES;
EXIT;
EOF

echo "🛑 Stopping safe mode MySQL..."
sudo killall mysqld
sleep 2

echo "🚀 Starting MySQL service normally..."
brew services start mysql
sleep 3

echo "🧪 Testing connection..."
if mysql -h 127.0.0.1 -P 3306 -u root -proot -e "SHOW DATABASES;" > /dev/null 2>&1; then
    echo "✅ Success! MySQL root password is now 'root'"
    echo ""
    echo "🌐 You can now access:"
    echo "   phpMyAdmin: http://localhost:8888/phpMyAdmin"
    echo "   Username: root"
    echo "   Password: root"
    echo ""
    echo "🗄️ Creating WordPress database..."
    mysql -h 127.0.0.1 -P 3306 -u root -proot -e "
    CREATE DATABASE IF NOT EXISTS h5p_wordpress 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;
    "
    echo "✅ Database 'h5p_wordpress' created successfully!"
else
    echo "❌ Something went wrong. Please try manually."
fi
