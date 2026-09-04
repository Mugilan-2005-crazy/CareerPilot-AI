const { v4: uuidv4 } = require('uuid');

/**
 * Request ID Middleware
 * 
 * Generates a unique request ID (UUID) for every incoming request
 * and attaches it to req.requestId for use throughout the request lifecycle.
 * 
 * The request ID is useful for:
 * - Correlating logs across microservices
 * - Tracing requests through multiple services
 * - Debugging and monitoring
 * - AI service correlation
 * 
 * Usage in controllers/services:
 * - Access via req.requestId
 * - Pass to logger.info(msg, { requestId: req.requestId })
 * - Pass to AI orchestrator: orchestrator.handle(task, payload, req.requestId)
 */

const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID if provided in header (for distributed tracing)
  // Otherwise generate a new one
  req.requestId = req.headers['x-request-id'] || req.headers['x-correlation-id'] || uuidv4();
  
  // Add to response headers for client-side correlation
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};

module.exports = requestIdMiddleware;
