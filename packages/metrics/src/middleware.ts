import type { NextFunction, Request, Response } from 'express'
import type { Histogram, Registry } from 'prom-client'
import {
  createHttpDurationHistogram,
  createHttpRequestCounter,
  createHttpSizeHistogram,
} from './collectors'
import type { DurationTimer, HttpMetricOptions } from './types'

/**
 * Creates Express middleware for automatic HTTP metrics collection
 */
export const createHttpMetricsMiddleware = (
  registry: Registry,
  options: HttpMetricOptions = {},
) => {
  const {
    prefix = '',
    routeExtractor = (req) => req.route?.path || req.path,
    shouldTrack = () => true,
    extraLabels = () => ({}),
  } = options

  // Create metric collectors with prefix
  const durationHistogram = createHttpDurationHistogram(
    registry,
    `${prefix}http_request_duration_seconds`,
  )
  const requestCounter = createHttpRequestCounter(
    registry,
    `${prefix}http_requests_total`,
  )
  const requestSizeHistogram = createHttpSizeHistogram(
    registry,
    `${prefix}http_request_size_bytes`,
  )
  const responseSizeHistogram = createHttpSizeHistogram(
    registry,
    `${prefix}http_request_size_bytes`,
    ['method', 'route'],
    true,
  )

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!shouldTrack(req)) {
      next()
      return
    }

    const startTime = process.hrtime()

    const requestSize = req.headers['content-length']
      ? Number.parseInt(req.headers['content-length'], 10)
      : undefined

    const originalSend = res.send
    let responseSize = 0

    res.send = function (data: unknown): Response {
      if (data && typeof data === 'string') {
        responseSize = Buffer.byteLength(data)
      } else if (data && Buffer.isBuffer(data)) {
        responseSize = data.length
      }
      return originalSend.call(this, data)
    }

    res.on('finish', () => {
      try {
        const [seconds, nanoseconds] = process.hrtime(startTime)
        const durationSeconds = seconds + nanoseconds / 1e9

        // Extract full route pattern including nested routers
        // req.baseUrl contains parent router paths (e.g., '/web')
        // req.route?.path contains the local route pattern (e.g., '/lists/:id')
        const route = routeExtractor(req)

        const baseLabels = {
          method: req.method,
          route,
          status_code: res.statusCode.toString(),
          ...extraLabels(req, res),
        }

        durationHistogram.observe(baseLabels, durationSeconds)
        requestCounter.inc(baseLabels)

        if (requestSize !== undefined) {
          requestSizeHistogram.observe(
            {
              method: req.method,
              route,
            },
            requestSize,
          )
        }

        if (responseSize > 0) {
          responseSizeHistogram.observe(baseLabels, responseSize)
        }
      } catch (_error) {
        // Silently ignore metrics errors to prevent breaking the application
        // Metrics collection should never crash the app
      }
    })

    next()
  }
}

/**
 * Creates an Express handler for the /metrics endpoint
 * Supports optional HTTP Basic Auth protection
 */
export const createMetricsHandler = (
  registry: Registry,
  options?: {
    username?: string
    password?: string
  },
) => {
  return async (req: Request, res: Response): Promise<void> => {
    // Basic Auth protection if credentials are provided
    if (options?.username && options?.password) {
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="Metrics"')
        res.status(401).end('Authentication required')
        return
      }

      try {
        const base64Credentials = authHeader.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString(
          'utf-8',
        )
        const [username, password] = credentials.split(':')

        // Use constant-time comparison to prevent timing attacks
        const usernameMatch =
          username.length === options.username.length &&
          Buffer.from(username).equals(Buffer.from(options.username))
        const passwordMatch =
          password.length === options.password.length &&
          Buffer.from(password).equals(Buffer.from(options.password))

        if (!usernameMatch || !passwordMatch) {
          res.set('WWW-Authenticate', 'Basic realm="Metrics"')
          res.status(401).end('Invalid credentials')
          return
        }
      } catch (_error) {
        res.set('WWW-Authenticate', 'Basic realm="Metrics"')
        res.status(401).end('Invalid authorization header')
        return
      }
    }

    // Serve metrics
    try {
      res.set('Content-Type', registry.contentType)
      const metrics = await registry.metrics()
      res.end(metrics)
    } catch (_error) {
      res.status(500).end('Error collecting metrics')
    }
  }
}

/**
 * Start a duration timer for a histogram metric
 * Returns a timer object with stop() method
 */
export const startDurationTimer = (
  histogram: Histogram<string>,
): DurationTimer => {
  const startTime = process.hrtime()

  return {
    stop: (labels = {}) => {
      const [seconds, nanoseconds] = process.hrtime(startTime)
      const durationSeconds = seconds + nanoseconds / 1e9

      histogram.observe(labels, durationSeconds)

      return durationSeconds
    },
    elapsed: () => {
      const [seconds, nanoseconds] = process.hrtime(startTime)
      return seconds + nanoseconds / 1e9
    },
  }
}

/**
 * Start a duration timer that doesn't record to any histogram
 * Useful for intermediate timing or conditional recording
 */
export const startTimer = (): DurationTimer => {
  const startTime = process.hrtime()

  return {
    stop: () => {
      const [seconds, nanoseconds] = process.hrtime(startTime)
      return seconds + nanoseconds / 1e9
    },
    elapsed: () => {
      const [seconds, nanoseconds] = process.hrtime(startTime)
      return seconds + nanoseconds / 1e9
    },
  }
}
