import { type RequestHandler } from "express"
import { logger } from "@repo/logger"

/**
 * Middleware to require an active organization
 * Returns 403 if the user does not have an active organization
 * Must be used after betterAuthMiddleware and requireAuth
 */
export const requireOrg: RequestHandler = (req, res, next) => {
  if (!req.auth?.orgId) {
    logger.warn({
      msg: "Organization required but not present",
      event: "auth.org_required",
      metadata: {
        path: req.path,
        method: req.method,
        userId: req.auth?.userId,
      },
    })

    return res.status(403).json({
      error: "Organization required",
      code: "ORG_REQUIRED",
    })
  }

  next()
}
