-- Drop database if it exists
DROP DATABASE IF EXISTS wordpress_db;

-- Create database with proper character set
CREATE DATABASE wordpress_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE wordpress_db;

-- Grant privileges to root
GRANT ALL PRIVILEGES ON wordpress_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES; 