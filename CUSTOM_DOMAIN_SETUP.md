# Custom Domain Setup Guide: hoclieutuongtac2.com

## 🎯 Goal
Set up **hoclieutuongtac2.com** to point to your H5P Interactive Learning Materials platform on Railway.

## 📋 DNS Configuration Required

### Railway Provided Information:
- **Railway Subdomain**: `29sg1r0w.up.railway.app`
- **Your Custom Domain**: `hoclieutuongtac2.com`

### DNS Record to Add:
```
Type: CNAME
Name: @ (or root)
Value: 29sg1r0w.up.railway.app
TTL: 300 (or Auto)
```

## 🔧 Step-by-Step Setup

### 1. **Access Your Domain Registrar**
Go to where you registered `hoclieutuongtac2.com` (e.g., GoDaddy, Namecheap, Google Domains)

### 2. **Find DNS Management**
Look for one of these sections:
- "DNS Records"
- "DNS Zone File"
- "Manage DNS"
- "Advanced DNS"

### 3. **Add CNAME Record**
Create a new record with:
- **Type**: CNAME
- **Host/Name**: @ (for root domain) or leave blank
- **Points to**: `29sg1r0w.up.railway.app`
- **TTL**: 300 seconds (5 minutes)

### 4. **Save Changes**
Click "Save" or "Apply Changes"

## ⏰ Propagation Timeline

- **Initial**: 5-15 minutes
- **Full Propagation**: Up to 72 hours
- **Typical**: 1-2 hours for most users

## 🔍 How to Test

### Check DNS Propagation:
```bash
# Test DNS lookup
nslookup hoclieutuongtac2.com

# Test with dig (more detailed)
dig hoclieutuongtac2.com

# Test HTTP response
curl -I http://hoclieutuongtac2.com
```

### Online Tools:
- [whatsmydns.net](https://www.whatsmydns.net) - Check global DNS propagation
- [dnschecker.org](https://dnschecker.org) - Verify DNS records worldwide

## 🎉 Expected Results

### After DNS Propagation:
1. **HTTP Access**: `http://hoclieutuongtac2.com` → redirects to Railway
2. **HTTPS Setup**: Railway automatically generates SSL certificate
3. **Final URL**: `https://hoclieutuongtac2.com` → Your H5P platform

### What You'll See:
- ✅ Railway detects the DNS record
- ✅ SSL certificate is automatically provisioned
- ✅ Your H5P Interactive Learning Materials platform accessible at your custom domain

## 🚨 Troubleshooting

### If DNS Doesn't Propagate:
1. **Double-check the CNAME value**: Must be exactly `29sg1r0w.up.railway.app`
2. **Remove conflicting records**: Delete any existing A records for the root domain
3. **Wait longer**: DNS can take up to 72 hours in some cases
4. **Contact registrar support**: If it's been over 24 hours

### Common Issues:
- **CNAME vs A Record**: Use CNAME, not A record
- **Subdomain confusion**: Use @ or root, not www
- **TTL too high**: Set TTL to 300 for faster updates

## 📱 Current Status
- ✅ Railway app is running at: `https://h5p-hoclieutuongtac-production.up.railway.app`
- 🔄 Custom domain pending DNS setup: `hoclieutuongtac2.com`
- ⏳ Railway waiting for DNS record detection

Once DNS propagates, your H5P platform will be accessible at:
**https://hoclieutuongtac2.com** 🎉
