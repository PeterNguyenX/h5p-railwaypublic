/**
 * Security Utilities
 * Helps protect sensitive information from being exposed in error messages
 */

/**
 * Sanitize error messages before sending to client
 * Removes API keys, connection strings, and other sensitive data
 * 
 * @param {Error|string} error - The error to sanitize
 * @returns {string} Safe error message for client
 */
function sanitizeErrorForClient(error) {
  const message = error.message || String(error);
  
  // Pattern list of sensitive strings to mask
  const sensitivePatterns = [
    /gsk_[a-zA-Z0-9]+/gi,              // Groq API keys (gsk_...)
    /sk_[a-zA-Z0-9]+/gi,               // OpenAI/Anthropic API keys (sk_...)
    /Bearer\s+[a-zA-Z0-9\-._]+/gi,     // Bearer tokens
    /Authorization:\s*[^\s]+/gi,       // Authorization headers
    /\?[^&]*apikey[^&]*/gi,            // API key in query params
    /[a-z0-9]{32,}/gi,                 // Potential tokens/secrets (32+ char hex/alphanum)
    /(password|passwd|pwd)\s*[:=]\s*[^\s]+/gi, // Passwords
    /(supabase|database)_[a-z_]*key[^,\s]*/gi, // Database keys
  ];
  
  let sanitized = message;
  
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  
  return sanitized;
}

/**
 * Wrap error response with sanitization
 * 
 * @param {*} error - The error object
 * @param {string} userMessage - Generic message to show user if error is too sensitive
 * @returns {object} Safe error object for response
 */
function createSafeErrorResponse(error, userMessage = 'An error occurred. Please try again.') {
  const sanitized = sanitizeErrorForClient(error);
  
  // If sanitization removed too much, use generic message
  if (sanitized.length < 10 || sanitized.includes('[REDACTED]')) {
    return {
      error: userMessage,
      // In development, include sanitized message for debugging
      ...(process.env.NODE_ENV === 'development' && { debug: sanitized })
    };
  }
  
  return { error: sanitized };
}

/**
 * Log error safely (for server logs)
 * Include full error details for debugging
 * 
 * @param {Error|string} error - Error to log
 * @param {string} context - Additional context
 */
function logErrorSafely(error, context = '') {
  // Log the full error to server logs (only visible to admins)
  const timestamp = new Date().toISOString();
  const message = error.message || String(error);
  const stack = error.stack || '';
  
  console.error(`[${timestamp}] ${context}\nMessage: ${message}\nStack: ${stack}`);
}

module.exports = {
  sanitizeErrorForClient,
  createSafeErrorResponse,
  logErrorSafely,
};
