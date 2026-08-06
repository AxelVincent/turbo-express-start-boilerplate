import { timingSafeEqual } from "node:crypto"
import { type RequestHandler } from "express"

const HEADER = "x-internal-auth"

/**
 * Guards service-to-service routes with a shared secret. Compared in constant
 * time so a wrong secret can't be recovered by timing the response, and the
 * route 503s rather than opening up when the secret isn't configured.
 */
export const requireInternalAuth: RequestHandler = (req, res, next) => {
  const secret = process.env.INTERNAL_RPC_SECRET
  if (!secret) {
    return res.status(503).json({ error: "Internal routes not configured" })
  }
  const provided = req.header(HEADER) ?? ""
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  next()
}
