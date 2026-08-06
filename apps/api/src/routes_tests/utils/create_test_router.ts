import { type Request, type Response, Router } from "express"
import asyncHandler from "express-async-handler"

/**
 * Signature for a test handler.
 * Handler completes without throwing -> 200 (test passed)
 * Handler throws -> 500 with error details (test failed)
 */
export type TestHandler = (_req: Request, _res: Response) => Promise<void>

/**
 * Creates a router from a map of { '/path': handlerFn }.
 */
export function createTestRouter(routes: Record<string, TestHandler>) {
  const router = Router()

  for (const [path, handler] of Object.entries(routes)) {
    router.get(
      path,
      asyncHandler(async (req: Request, res: Response) => {
        try {
          await handler(req, res)
          res.status(200).json({ ok: true })
        } catch (error) {
          const err = error as Error
          res.status(500).json({
            ok: false,
            message: err.message,
            stack: err.stack,
          })
        }
      }),
    )
  }

  return router
}
