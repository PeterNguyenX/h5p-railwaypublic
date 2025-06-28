# 🔧 MAMP Troubleshooting Guide

## ✅ Current Status: MAMP is Running!

Your MAMP installation is working correctly with these settings:
- **Apache Port**: 8888 (not 8080)
- **MySQL Port**: 3306
- **phpMyAdmin**: Available at http://localhost:8888/phpMyAdmin

## 🌐 Access URLs

✅ **Working URLs**:
- MAMP Start Page: http://localhost:8888/MAMP/
- phpMyAdmin: http://localhost:8888/phpMyAdmin (redirects to phpMyAdmin5)
- MySQL: localhost:3306 (username: root, password: root)

## 📋 Next Steps for WordPress Setup

### 1. Access phpMyAdmin
Visit: http://localhost:8888/phpMyAdmin

### 2. Create Database
- Click "New" in the left sidebar
- Database name: `h5p_wordpress`
- Collation: `utf8mb4_unicode_ci`
- Click "Create"

### 3. Run Setup Script
```bash
cd /Users/peternguyen/Downloads/itp-h5p
./setup-wordpress-mamp.sh
```

### 4. Install WordPress
- Visit: http://localhost:8888/h5p-wp
- Follow WordPress installation wizard
- Use these database settings:
  - Database Name: `h5p_wordpress`
  - Username: `root`
  - Password: `root`
  - Database Host: `localhost`

### 5. Activate H5P Plugin
- Login to WordPress admin: http://localhost:8888/h5p-wp/wp-admin
- Go to Plugins > Installed Plugins
- Activate "H5P" plugin

### 6. Test Integration
- Start your app: `npm run start:mamp`
- Visit: http://localhost:3000/wordpress

## 🚨 Common Issues & Solutions

### Issue: "Connection declined" to phpMyAdmin
**Solution**: Use correct port 8888, not 8080
- ❌ Wrong: http://localhost:8080/phpMyAdmin
- ✅ Correct: http://localhost:8888/phpMyAdmin

### Issue: MAMP not starting
1. Quit MAMP completely
2. Check if ports are free:
   ```bash
   lsof -i :8888
   lsof -i :3306
   ```
3. Kill any conflicting processes
4. Restart MAMP

### Issue: WordPress can't connect to database
1. Verify database exists in phpMyAdmin
2. Check wp-config.php database settings
3. Ensure MAMP MySQL is running

### Issue: H5P plugin not working
1. Check plugin folder permissions
2. Verify plugin files copied correctly:
   ```bash
   ls -la /Applications/MAMP/htdocs/h5p-wp/wp-content/plugins/h5p/
   ```

## 🔍 Verification Commands

Check if MAMP services are running:
```bash
# Check Apache
curl -I http://localhost:8888/MAMP/

# Check MySQL
mysql -h 127.0.0.1 -P 3306 -u root -proot -e "SHOW DATABASES;"

# Check phpMyAdmin
curl -I http://localhost:8888/phpMyAdmin
```

## 📞 Support

If you encounter other issues:
1. Check MAMP logs in Applications/MAMP/logs/
2. Restart MAMP completely
3. Verify all URLs use port 8888 (not 8080)
