const { AuditLog } = require('../models');
const logger = require('../utils/logger');

/**
 * Create an audit log entry
 */
const createAuditLog = async (adminId, action, targetType, targetId = null, description = null, details = null, req = null) => {
  try {
    const ipAddress = req ? (req.ip || req.connection.remoteAddress) : null;
    const userAgent = req ? req.get('user-agent') : null;

    await AuditLog.create({
      adminId,
      action,
      targetType,
      targetId,
      description,
      details,
      ipAddress,
      userAgent
    });
  } catch (error) {
    logger.error('Failed to create audit log', { error: error.message, action, targetType });
  }
};

/**
 * Middleware to log admin actions
 */
const auditLoggingMiddleware = (action, targetType) => {
  return async (req, res, next) => {
    // Capture the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only log successful actions
      if (res.statusCode < 400) {
        const targetId = req.params.id || req.body.userId;
        createAuditLog(
          req.user?.id,
          action,
          targetType,
          targetId,
          `${action} on ${targetType}`,
          { method: req.method, path: req.path },
          req
        );
      }
      return originalJson.call(this, data);
    };
    next();
  };
};

module.exports = {
  createAuditLog,
  auditLoggingMiddleware
};
