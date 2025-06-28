# LTI Link Generation Error Fix

## Problem
The LTI link generation was failing with a 500 Internal Server Error:
```
GET http://localhost:3001/api/lti/generate/02e4db13-f43b-4532-a8fc-9aa84b1930ef 500 (Internal Server Error)
```

The backend logs showed:
```
Error generating LTI link: Error: secretOrPrivateKey must have a value
```

## Root Causes

1. **Missing Environment Variables**: The `LTI_SECRET` and `APP_URL` environment variables were not set in the `.env` file.

2. **Missing Authentication**: The LTI routes didn't have authentication middleware, but the Dashboard was calling them as an authenticated user.

3. **No User Ownership Check**: Users could potentially generate LTI links for videos they don't own.

## Solution Implemented

### 1. Added Missing Environment Variables to `.env`
```properties
# LTI Configuration
LTI_SECRET=your-secret-key-for-lti-tokens-make-it-long-and-secure
APP_URL=http://localhost:3000
```

### 2. Added Authentication Middleware to LTI Routes
Updated `/backend/routes/ltiRoutes.js`:
```javascript
const auth = require("../middleware/auth");

// Generate LTI link for a video
router.get("/generate/:videoId", auth, async (req, res) => {
```

### 3. Added User Ownership Check
Ensured users can only generate LTI links for their own videos:
```javascript
const video = await Video.findOne({
  where: { 
    id: req.params.videoId,
    userId: req.user.id  // Only allow users to generate LTI links for their own videos
  }
});
```

## Files Modified

1. **Backend Environment**: `/backend/.env`
   - Added `LTI_SECRET` and `APP_URL` variables

2. **Backend Routes**: `/backend/routes/ltiRoutes.js`
   - Added authentication middleware import
   - Added auth middleware to the generate route
   - Added user ownership check in the database query

## Testing

After the fix, the LTI endpoint should:
1. ✅ Generate valid JWT tokens using the LTI_SECRET
2. ✅ Require authentication 
3. ✅ Only allow users to generate links for their own videos
4. ✅ Return properly formatted LTI links

Example successful response:
```json
{
  "ltiLink": "http://localhost:3000/lti/embed/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Current Status
✅ **FIXED** - LTI link generation now works properly with authentication and security checks.
