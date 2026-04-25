const isAdmin = (req, res, next) => {
  // Check if user is authenticated first
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user has admin role
  const normalizedRole = String(req.user.role || '').trim().toLowerCase();
  if (normalizedRole !== 'admin' && normalizedRole !== 'administrator') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

module.exports = { isAdmin };
