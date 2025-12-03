import pinoHttp from 'pino-http'
import { type Request, type RequestHandler } from 'express'
import { baseLogger } from '@repo/logger'

export const pinoMiddleware: RequestHandler = pinoHttp({
    logger: baseLogger,
    autoLogging: {
      ignore: (req) => req.method === 'OPTIONS',
    },
    // Minimal request serialization
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          // Limit body size in logs
          body: req.raw.body
            ? JSON.stringify(req.raw.body).slice(0, 1000)
            : undefined,
          query: req.raw.query,
        }
      },
    },
    // Only include essential custom props
    customProps: (req: Request) => ({
      user: {
        userId: req.auth?.userId,
        sessionId: req.auth?.sessionId,
        firstName: req.auth?.firstName,
        lastName: req.auth?.lastName,
        email: req.auth?.email,
      },
    }),
    // Redact sensitive data
    redact: ['req.headers'],
    // Simple log messages
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.baseUrl}${req.url} - ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.baseUrl}${req.url} - ${res.statusCode} - ${err.message}`,
  })