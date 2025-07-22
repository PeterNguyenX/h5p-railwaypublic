const jwt = require('jsonwebtoken');
const User = require('../models/User');

// List of public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',      // Main web interface
  '/projects', // Projects list page
  '/view'   // For viewing specific projects
];

const auth = async (req, res, next) => {
  // Check if the path is public
  const currentPath = req.path;
  // For non-API main interface routes, bypass authentication
  if (PUBLIC_PATHS.some(publicPath => currentPath.startsWith(publicPath)) && !req.path.startsWith('/api')) {
    console.log(`Public access granted for path: ${currentPath}`);
    req.user = { id: null, isPublic: true };
    return next();
  }

  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    console.log('JWT decoded payload:', decoded);
    const userId = decoded.userId || decoded.id; // Handle both userId and id fields
    console.log('Extracted user ID:', userId);
    
    if (!userId) {
      throw new Error('Invalid token format');
    }

    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      console.error(`User not found for ID: ${userId}`);
      throw new Error('User not found');
    }
    
    // Check if user is active (treat null/undefined as active for backward compatibility)
    if (user.isActive === false) {
      console.error(`User ${userId} is inactive`);
      throw new Error('User inactive');
    }
    
    console.log(`Auth successful for user: ${user.username} (${user.id}), role: ${user.role}`);

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    // Return an empty projects array when not authenticated instead of error for API projects route
    if (req.path === '/') {
      console.log('Unauthenticated access to projects route - returning empty array');
      req.user = { id: null }; // Set a dummy user with null id
      return next();
    }
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        throw new Error();
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

module.exports = { auth, adminAuth };
