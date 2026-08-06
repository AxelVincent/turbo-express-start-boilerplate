import { type RequestHandler } from "express"

/**
 * Protects all /apitests/* endpoints with a shared secret token.
 * Prevents accidental access in non-test environments.
 */
export const testsAuther: RequestHandler = (req, res, next) => {
  const expected = process.env.HEALTH_AUTH_TOKEN || "test-secret"

  if (req.headers.authorization !== expected) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  next()
}
