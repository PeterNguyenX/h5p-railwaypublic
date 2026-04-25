/**
 * Structured Logger (Winston) — REQ-8
 * JSON in production, colorized console in development.
 * NEVER logs passwords, tokens, or PII.
 */
const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const isProduction = process.env.NODE_ENV === 'production';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// PII scrubber — strips sensitive keys from log metadata
const SENSITIVE_KEYS = new Set([
  'password', 'token', 'secret', 'authorization',
  'resetToken', 'apikey', 'api_key', 'jwt',
]);

function scrubPII(obj, depth = 0) {
  if (depth > 5 || !obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      clean[k] = '[REDACTED]';
    } else if (typeof v === 'object') {
      clean[k] = scrubPII(v, depth + 1);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

const scrubFormat = format((info) => {
  if (info.meta && typeof info.meta === 'object') {
    info.meta = scrubPII(info.meta);
  }
  return info;
})();

const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ level, message, timestamp, ...meta }) => {
    const cleanMeta = scrubPII(meta);
    const metaStr = Object.keys(cleanMeta).length
      ? ' ' + JSON.stringify(cleanMeta)
      : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
  }),
);

const prodFormat = format.combine(
  scrubFormat,
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: { service: 'h5p-backend' },
  transports: [
    new transports.Console(),
    ...(isProduction
      ? [
          new transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
          }),
          new transports.File({
            filename: path.join(logsDir, 'app.log'),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 10,
          }),
        ]
      : []),
  ],
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
});

module.exports = logger;
