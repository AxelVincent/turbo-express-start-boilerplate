import { type RequestHandler } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth/auth"
import { logger } from "@repo/logger"
import { getDatabase } from "../db/database"

/**
 * Middleware to extract Better Auth session and populate req.auth
 * Runs on every request. If no session is found, req.auth has empty defaults.
 */
export const betterAuthMiddleware: RequestHandler = async (req, _res, next) => {
  req.auth = {
    userId: "",
    sessionId: "",
    email: "",
    name: "",
    image: "",
    role: "",
    orgId: "",
    orgRole: "",
  }

  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })

    if (session?.session && session?.user) {
      const orgId =
        ((session.session as Record<string, unknown>)
          .activeOrganizationId as string) || ""

      let orgRole = ""
      if (orgId) {
        try {
          const db = getDatabase()
          const member = await db
            .selectFrom("member")
            .select(["role"])
            .where("organization_id", "=", orgId)
            .where("user_id", "=", session.user.id)
            .executeTakeFirst()
          orgRole = member?.role || ""
        } catch {
          // Don't fail auth if member lookup fails
        }
      }

      req.auth = {
        userId: session.user.id,
        sessionId: session.session.id,
        email: session.user.email,
        name: session.user.name || "",
        image: session.user.image || "",
        role: ((session.user as Record<string, unknown>).role as string) || "",
        orgId,
        orgRole,
      }

      logger.debug({
        msg: "User authenticated via Better Auth",
        event: "auth.better_auth.success",
        metadata: {
          userId: session.user.id,
          sessionId: session.session.id,
        },
      })
    }

    next()
  } catch (error) {
    logger.error({
      msg: "Error in Better Auth middleware",
      event: "auth.better_auth.error",
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
    next()
  }
}
