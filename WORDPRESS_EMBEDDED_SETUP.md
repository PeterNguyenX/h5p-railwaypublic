# WordPress Embedded View Setup

## Overview
The WordPress integration provides both **direct access** and **embedded view** options.

## Access Methods

### 1. Direct Access (Recommended)
- **WordPress Site**: Opens the main WordPress site in a new tab
- **WordPress Admin**: Opens the WordPress dashboard in a new tab  
- **Plugins**: Opens the plugins management page in a new tab

✅ **Advantages**: Full functionality, no iframe restrictions, all WordPress features work
❌ **Disadvantages**: Opens in separate tabs

### 2. Embedded View
- **Dashboard**: WordPress admin embedded in the app
- **Site**: WordPress front-end embedded in the app
- **Plugins**: Plugin management embedded in the app

✅ **Advantages**: Stays within the app interface
❌ **Disadvantages**: Some WordPress features may not work due to iframe restrictions

## Common Issues & Solutions

### Issue: "Refused to display in a frame because it set 'X-Frame-Options' to 'sameorigin'"
**Cause**: WordPress or web server is preventing iframe embedding for security reasons.

**Solutions**:
1. **Use "Open in New Tab"** - This completely bypasses iframe restrictions
2. **WordPress Configuration** - Add this to your WordPress `wp-config.php`:
   ```php
   // Allow iframe embedding (use with caution)
   header('X-Frame-Options: ALLOWALL');
   ```
3. **Apache/MAMP Configuration** - Add to `.htaccess` in WordPress root:
   ```apache
   Header always unset X-Frame-Options
   ```
4. **Use Direct Links** - The "WordPress Admin", "WordPress Site" buttons open in new tabs without restrictions

### Issue: Embedded view shows blank page
**Cause**: WordPress security settings or authentication issues.

**Solutions**:
1. Click "Open in New Tab" button in the embedded view
2. Login to WordPress in the new tab first
3. Return to embedded view after authentication

### Issue: CSS/fonts not loading in embedded view
**Cause**: Content Security Policy restrictions.

**Solutions**:
1. Use direct access links instead of embedded view
2. The proxy has been configured to handle most CSP issues

## WordPress Setup Requirements

1. **MAMP Running**: WordPress must be accessible at `http://localhost:8888/h5p-wp/`
2. **WordPress Installed**: Complete WordPress installation required
3. **User Account**: WordPress admin account for full access
4. **H5P Plugin**: Install H5P plugin for full integration

## Testing Access

Test these URLs directly in your browser:
- WordPress Site: `http://localhost:8888/h5p-wp/`
- WordPress Admin: `http://localhost:8888/h5p-wp/wp-admin/`

If these don't work, check MAMP configuration and WordPress installation.
