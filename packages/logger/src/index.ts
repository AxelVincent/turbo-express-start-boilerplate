import { AsyncLocalStorage } from 'node:async_hooks'
import pino from 'pino'

interface LogContext {
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  // Add request metadata to context
  request?: {
    id: string
    ipAddress: string
    userAgent?: string
    timestamp: Date
  }
}

// Create AsyncLocalStorage to store context
const asyncLocalStorage = new AsyncLocalStorage<LogContext>()

// Add helper to merge contexts
const mergeContext = (
  existing: LogContext | undefined,
  newContext: LogContext,
): LogContext => {
  if (!existing) return newContext

  return {
    // Preserve existing user context if new context doesn't provide one
    user: newContext.user ?? existing.user,
    // Preserve existing request context if new context doesn't provide one
    request: newContext.request ?? existing.request,
  }
}

interface LogPayload {
  msg: string
  event: string
  metadata?: Record<string, unknown>
}

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development'
    ? {
        transport: {
          targets: [
            {
              level: process.env.LOG_LEVEL || 'debug',
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss.l',
                ignore: 'pid,hostname',
              },
            },
            {
              level: process.env.LOG_LEVEL || 'debug',
              target: 'pino-loki',
              options: {
                batching: false,
                host: process.env.LOKI_HOST || 'http://localhost:3100',
                labels: { job: 'pino', service: 'boilerplate' },
              },
            },
          ],
        },
      }
    : {
        transport: {
          targets: [
            {
              level: process.env.LOG_LEVEL || 'info',
              target: 'pino/file',
              options: {
                destination: 1, // stdout (1 = stdout, 2 = stderr)
              },
            },
            {
              level: process.env.LOG_LEVEL || 'info',
              target: 'pino-loki',
              options: {
                batching: false,
                host: process.env.LOKI_HOST || 'http://localhost:3100',
                labels: {
                  job: 'pino',
                  service: 'boilerplate',
                  environment: process.env.NODE_ENV || 'production',
                },
              },
            },
          ],
        },
        messageKey: 'msg',
        serializers: pino.stdSerializers,
      }),
  serializers: pino.stdSerializers,
})

// Wrap the logger to enforce the payload structure and inject context
const logger = {
  info: (payload: LogPayload) => {
    const context = asyncLocalStorage.getStore()
    baseLogger.info({ ...payload, ...(context || {}) })
  },
  error: (payload: LogPayload) => {
    const context = asyncLocalStorage.getStore()
    baseLogger.error({ ...payload, ...(context || {}) })
  },
  warn: (payload: LogPayload) => {
    const context = asyncLocalStorage.getStore()
    baseLogger.warn({ ...payload, ...(context || {}) })
  },
  debug: (payload: LogPayload) => {
    const context = asyncLocalStorage.getStore()
    baseLogger.debug({ ...payload, ...(context || {}) })
  },
  runWithContext: <T>(newContext: LogContext, fn: () => T): T => {
    const existingContext = asyncLocalStorage.getStore()
    const mergedContext = mergeContext(existingContext, newContext)
    return asyncLocalStorage.run(mergedContext, fn)
  },
  getContext: (): LogContext | undefined => {
    return asyncLocalStorage.getStore()
  },
}

export { logger, baseLogger, type LogContext }
