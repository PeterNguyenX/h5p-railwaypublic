/**
 * Role-Based Access Control (RBAC) Middleware
 * REQ-1: Every resource access validated against resource owner_id.
 */
const logger = require('../utils/logger');

/**
 * requireOwnership — ensures the authenticated user owns the resource.
 * @param {Function} findResource - async fn(id) → resource object with .userId
 * @param {string} paramKey - key in req.params that holds the resource id
 */
function requireOwnership(findResource, paramKey = 'id') {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramKey];
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID missing', code: 'MISSING_ID' });
      }

      const resource = await findResource(resourceId);

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
      }

      // Admins bypass ownership checks
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Compare string UUIDs
      const ownerId = resource.userId?.toString() || resource.user_id?.toString();
      const requesterId = req.user.id?.toString();

      if (!ownerId || ownerId !== requesterId) {
        logger.warn('RBAC: Access denied', {
          userId: requesterId,
          resourceOwnerId: ownerId,
          resourceId,
          path: req.path,
        });
        return res.status(403).json({
          error: 'Access denied. You do not own this resource.',
          code: 'FORBIDDEN',
        });
      }

      req.resource = resource;
      next();
    } catch (err) {
      logger.error('RBAC middleware error', { error: err.message });
      next(err);
    }
  };
}

/**
 * requireRole — restricts endpoint to users with specific role.
 * Usage: router.delete('/...', auth, requireRole('admin'), handler)
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
    }
    if (req.user.role !== role) {
      logger.warn('RBAC: Role check failed', {
        userId: req.user.id,
        requiredRole: role,
        actualRole: req.user.role,
        path: req.path,
      });
      return res.status(403).json({
        error: `Access denied. Requires role: ${role}`,
        code: 'FORBIDDEN',
      });
    }
    next();
  };
}

module.exports = { requireOwnership, requireRole };
