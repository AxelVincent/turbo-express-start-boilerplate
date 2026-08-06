import { type RequestHandler } from "express"
import { randomUUID } from "node:crypto"
import { logger } from "@repo/logger"

// Reconstruct parameterized full path (e.g. /web/users/:userId/sessions) by
// substituting concrete req.params values back to their placeholders. Replaces
// longest values first so a short param value can't collide with a substring of
// a longer one. Keeps log/metric cardinality bounded by route rather than by id.
function getRoutePath(
  originalUrl: string,
  params: Record<string, unknown>,
): string {
  const path = originalUrl.split("?")[0]
  const entries = Object.entries(params)
    .filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].length > 0,
    )
    .sort((a, b) => b[1].length - a[1].length)
  let result = path
  for (const [key, value] of entries) {
    result = result.split(value).join(`:${key}`)
  }
  return result
}

export function withLogger<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
>(
  handler: RequestHandler<P, ResBody, ReqBody, ReqQuery>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID()
    res.setHeader("x-request-id", requestId)

    const context = {
      request: {
        id: requestId,
        ipAddress: req.ip ?? "",
        userAgent: req.get("user-agent"),
        timestamp: new Date(),
      },
      user: req.auth?.userId
        ? {
            id: req.auth.userId,
            email: req.auth.email,
            name: req.auth.name || undefined,
            role: req.auth.role || undefined,
            orgId: req.auth.orgId || undefined,
            orgRole: req.auth.orgRole || undefined,
          }
        : undefined,
    }

    logger.runWithContext(context, () => {
      const routePath = getRoutePath(
        req.originalUrl,
        req.params as Record<string, unknown>,
      )
      logger.debug({
        msg: `${req.method} ${req.originalUrl} - started`,
        event: "http.request.start",
        metadata: { method: req.method, url: req.originalUrl, routePath },
      })

      const start = Date.now()
      let logged = false
      let thrown: { error: string; stack?: string } | undefined

      const finish = (aborted: boolean) => {
        if (logged) return
        logged = true
        const status = res.statusCode
        const payload = {
          msg: `${req.method} ${req.originalUrl} - ${status}${aborted ? " (aborted)" : ""}`,
          event: "http.request",
          metadata: {
            method: req.method,
            url: req.originalUrl,
            route: req.route?.path,
            routePath,
            status,
            durationMs: Date.now() - start,
            aborted,
            ...thrown,
          },
        }
        // A client closing the connection early (aborted) is normal for SSE
        // streams and other long-lived requests — level is driven by the status,
        // not the abort, so benign disconnects don't flood the error stream.
        if (status >= 500) logger.error(payload)
        else if (status >= 400) logger.warn(payload)
        else logger.info(payload)
      }

      res.on("finish", () => finish(false))
      res.on("close", () => finish(!res.writableEnded))

      // Recorded, not logged: next(err) produces a 5xx that finish() then logs
      // once, with the error folded in. Logging here too would double every alert.
      Promise.resolve(handler(req, res, next)).catch((err) => {
        thrown =
          err instanceof Error
            ? { error: err.message, stack: err.stack }
            : { error: String(err) }
        next(err)
      })
    })
  }
}
