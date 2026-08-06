import { type Request, type Response, type NextFunction } from "express"
import onFinished from "on-finished"

interface RequestLog {
  url: string
  method: string
  requestTime: string
  status: number
}

const requestLogs: RequestLog[] = []

function logRequest(req: Request, res: Response, startTime: bigint) {
  const elapsed = Number(process.hrtime.bigint() - startTime) / 1e6
  const log: RequestLog = {
    url: req.originalUrl,
    method: req.method,
    requestTime: `${elapsed.toFixed(1)}ms`,
    status: res.statusCode,
  }
  requestLogs.push(log)

  if (res.statusCode >= 400) {
    console.log(
      `[TEST] ${log.method} ${log.url} -> ${log.status} (${log.requestTime})`,
    )
  }
}

/**
 * Tracks timing information for each test route request.
 */
export function testTracker(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startTime = process.hrtime.bigint()
  onFinished(res, () => logRequest(req, res, startTime))
  next()
}
