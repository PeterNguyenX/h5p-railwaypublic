/**
 * Zod Validation Middleware — REQ-2
 * Usage: router.post('/route', validate(mySchema), handler)
 */
const { ZodError } = require('zod');

/**
 * validate(schema) — validates req.body against a Zod schema.
 * Returns 422 with structured error details on failure.
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      // Replace body with parsed+stripped version so downstream sees clean data
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));
        return res.status(422).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details,
        });
      }
      next(err);
    }
  };
}

/**
 * validateQuery(schema) — validates req.query against a Zod schema.
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(422).json({
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details,
        });
      }
      next(err);
    }
  };
}

/**
 * validateParams(schema) — validates req.params against a Zod schema.
 */
function validateParams(schema) {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({
          error: 'Invalid route parameters',
          code: 'VALIDATION_ERROR',
          details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        });
      }
      next(err);
    }
  };
}

module.exports = { validate, validateQuery, validateParams };
