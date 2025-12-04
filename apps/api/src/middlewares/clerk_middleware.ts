import { clerkMiddleware, getAuth } from '@clerk/express'
import { type RequestHandler } from 'express'
import { logger } from '@repo/logger'

/**
 * Clerk authentication middleware
 * Verifies JWT tokens and populates req.auth with user data
 */
export const clerkAuthMiddleware: RequestHandler = clerkMiddleware() as RequestHandler

/**
 * Middleware to populate req.auth with Clerk user information
 * Must be used after clerkAuthMiddleware
 */
export const populateAuthMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const auth = getAuth(req)

    if (auth.userId) {
      // Populate the req.auth object as defined in express.d.ts
      req.auth = {
        userId: auth.userId,
        sessionId: auth.sessionId || '',
        clerkId: auth.userId,
        // These will be populated from Clerk's user object if needed
        email: '',
        firstName: '',
        lastName: '',
        token: auth.sessionId || '',
      }

      logger.debug({
        msg: 'User authenticated via Clerk',
        event: 'auth.clerk.success',
        metadata: {
          userId: auth.userId,
          sessionId: auth.sessionId,
        },
      })
    }

    next()
  } catch (error) {
    logger.error({
      msg: 'Error in Clerk auth middleware',
      event: 'auth.clerk.error',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    next(error)
  }
}
