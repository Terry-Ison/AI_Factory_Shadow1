import { logger } from '../utils/logger.js'

/**
 * Express global error handler (must be registered last).
 */
export function globalErrorHandler(err, _req, res, _next) {
  logger.error('Unhandled HTTP error:', err)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: err.message || 'Internal server error',
  })
}
