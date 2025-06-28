# 🔧 MAMP MySQL Connection Fix

## Problem
phpMyAdmin shows: "Cannot connect: invalid settings" because MAMP's phpMyAdmin is trying to connect to MySQL with credentials that don't match your system MySQL.

## Current Situation
- Homebrew MySQL is running on port 3306
- MAMP's phpMyAdmin expects username: `root`, password: `root`
- Your system MySQL has different credentials

## Solutions

### Option 1: Use System MySQL with phpMyAdmin (Recommended)

1. **Find your MySQL root password**:
   ```bash
   # If you don't know your MySQL password, reset it:
   brew services stop mysql
   mysqld_safe --skip-grant-tables &
   mysql -u root
   ```
   
   In MySQL console:
   ```sql
   USE mysql;
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
   FLUSH PRIVILEGES;
   EXIT;
   ```
   
   Then restart MySQL:
   ```bash
   killall mysqld
   brew services start mysql
   ```

2. **Test the connection**:
   ```bash
   mysql -h 127.0.0.1 -P 3306 -u root -proot -e "SHOW DATABASES;"
   ```

### Option 2: Start MAMP's Own MySQL

1. **Stop Homebrew MySQL**:
   ```bash
   brew services stop mysql
   ```

2. **Start MAMP with both Apache and MySQL**:
   - Open MAMP application
   - Make sure both Apache and MySQL lights are green
   - If MySQL won't start, change the port in MAMP preferences

3. **Verify MAMP MySQL is running**:
   ```bash
   lsof -i :3306
   # Should show MAMP's mysqld process
   ```

### Option 3: Configure phpMyAdmin for Your MySQL

1. **Edit phpMyAdmin config** (if accessible):
   ```bash
   # Find phpMyAdmin config
   find /Applications/MAMP -name "config.inc.php" -path "*/phpMyAdmin*"
   ```

2. **Update database credentials** in the config file to match your system MySQL.

## Quick Fix (Recommended)

Let's reset your system MySQL password to 'root' to match MAMP's expectations:

```bash
# Stop MySQL
sudo brew services stop mysql

# Start MySQL in safe mode
sudo mysqld_safe --skip-grant-tables &

# Connect and change password
mysql -u root
```

In MySQL:
```sql
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
FLUSH PRIVILEGES;
EXIT;
```

Then:
```bash
# Kill safe mode
sudo killall mysqld

# Restart MySQL normally
brew services start mysql

# Test connection
mysql -h 127.0.0.1 -P 3306 -u root -proot -e "SHOW DATABASES;"
```

After this, phpMyAdmin should work at: http://localhost:8888/phpMyAdmin

## Alternative: Use Command Line

If phpMyAdmin still doesn't work, you can create the WordPress database directly:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -proot -e "
CREATE DATABASE IF NOT EXISTS h5p_wordpress 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
"
```

## Verification

After applying the fix:
1. Visit: http://localhost:8888/phpMyAdmin
2. Login with username: `root`, password: `root`
3. Create database: `h5p_wordpress`
