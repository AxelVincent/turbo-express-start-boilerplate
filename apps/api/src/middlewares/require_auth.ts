import { type RequestHandler } from 'express'
import { logger } from '@repo/logger'

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 * Must be used after clerkAuthMiddleware and populateAuthMiddleware
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    logger.warn({
      msg: 'Unauthorized access attempt',
      event: 'auth.unauthorized',
      metadata: {
        path: req.path,
        method: req.method,
      },
    })

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    })
  }

  next()
}

/**
 * Middleware for optional authentication
 * Allows the request to proceed whether authenticated or not
 * Useful for routes that work for both authenticated and guest users
 */
export const optionalAuth: RequestHandler = (_req, _res, next) => {
  // Simply pass through - auth will be populated if user is authenticated
  next()
}
