/**
 * Request Logger Middleware — attaches requestId, logs request start/end.
 * REQ-8: Structured logging with request metadata.
 */
const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const requestId = randomUUID();
  const startTime = Date.now();

  // Attach to request for downstream use
  req.requestId = requestId;

  // Log incoming request (no body to avoid logging PII/passwords)
  logger.info('HTTP Request', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]('HTTP Response', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      userId: req.user?.id || null,
    });
  });

  next();
}

module.exports = requestLogger;
