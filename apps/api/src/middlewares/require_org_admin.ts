import { type RequestHandler } from "express"
import { logger } from "@repo/logger"

/**
 * Middleware to require org admin role
 * Returns 403 if the user is not an admin of the active organization
 * Must be used after betterAuthMiddleware and requireAuth
 */
export const requireOrgAdmin: RequestHandler = (req, res, next) => {
  if (req.auth?.orgRole !== "admin" && req.auth?.orgRole !== "owner") {
    logger.warn({
      msg: "Org admin required but user is not admin",
      event: "auth.org_admin_required",
      metadata: {
        path: req.path,
        method: req.method,
        userId: req.auth?.userId,
        orgId: req.auth?.orgId,
        orgRole: req.auth?.orgRole,
      },
    })

    return res.status(403).json({
      error: "Admin access required",
      code: "ORG_ADMIN_REQUIRED",
    })
  }

  next()
}
