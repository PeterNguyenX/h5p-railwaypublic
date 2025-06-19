-- Create the WordPress database
CREATE DATABASE IF NOT EXISTS wordpress_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Create a user for WordPress
CREATE USER IF NOT EXISTS 'wordpress_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON wordpress_db.* TO 'wordpress_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Show the created database
SHOW DATABASES; 