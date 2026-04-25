/**
 * Global Error Handler Middleware — REQ-6
 * Maps error types to HTTP status codes, never exposes stacks in production.
 * Integrates with Sentry for 5xx error tracking.
 */
const logger = require('../utils/logger');

// Try to load Sentry — optional, won't crash if not configured
let Sentry;
try {
  Sentry = require('@sentry/node');
} catch {
  // Sentry not installed or not configured
}

/**
 * notFound — handles 404s for unmatched routes.
 * Mount BEFORE the error handler.
 */
function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.path}`);
  err.statusCode = 404;
  err.code = 'NOT_FOUND';
  next(err);
}

/**
 * errorHandler — global Express error handler.
 * MUST be mounted last (4 params signature).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Determine HTTP status
  const status =
    err.statusCode ||
    err.status ||
    (err.name === 'UnauthorizedError' ? 401 : null) ||
    (err.name === 'ForbiddenError' ? 403 : null) ||
    (err.name === 'ValidationError' ? 422 : null) ||
    (err.name === 'ZodError' ? 422 : null) ||
    500;

  // Determine error code
  const code = err.code || (status === 404 ? 'NOT_FOUND' : status === 401 ? 'UNAUTHENTICATED' : status === 403 ? 'FORBIDDEN' : status === 422 ? 'VALIDATION_ERROR' : status === 429 ? 'RATE_LIMITED' : 'INTERNAL_ERROR');

  // Structured log
  const logMeta = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode: status,
    errorCode: code,
    userId: req.user?.id || null,
    ...(isProduction ? {} : { stack: err.stack }),
  };

  if (status >= 500) {
    logger.error(err.message, logMeta);
    // Report to Sentry
    if (Sentry?.captureException) {
      Sentry.captureException(err, {
        user: req.user ? { id: req.user.id, username: req.user.username } : undefined,
        tags: { requestId: req.requestId },
      });
    }
  } else if (status >= 400) {
    logger.warn(err.message, logMeta);
  }

  // Send tiered response — NEVER expose stack in production (REQ-6)
  const body = {
    error: getClientMessage(status, err, isProduction),
    code,
  };

  // Add validation details when available
  if (err.details) body.details = err.details;
  if (!isProduction && err.stack) body.stack = err.stack;

  res.status(status).json(body);
}

function getClientMessage(status, err, isProduction) {
  if (status === 400) return err.message || 'Bad request';
  if (status === 401) return 'Authentication required. Please log in.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 409) return err.message || 'Conflict with existing data.';
  if (status === 422) return err.message || 'The submitted data is invalid.';
  if (status === 429) return 'Too many requests. Please slow down and try again shortly.';
  if (status >= 500) {
    return isProduction
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal server error';
  }
  return err.message || 'An error occurred';
}

module.exports = { notFound, errorHandler };
