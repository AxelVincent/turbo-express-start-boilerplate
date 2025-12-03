import { logger } from '@repo/logger'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { z } from 'zod'
import type { ErrorResponse } from '../types/errors'

type ZodValidationOptions<TParams, TQuery, TBody, TResponse> = {
  paramsSchema?: z.ZodType<TParams, any, any>
  querySchema?: z.ZodType<TQuery, any, any>
  bodySchema?: z.ZodType<TBody, any, any>
  responseSchema?: z.ZodType<TResponse>
}

export const validateRequest = <
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  TResponse = unknown,
>(
  options: ZodValidationOptions<TParams, TQuery, TBody, TResponse>,
): RequestHandler<TParams, TResponse | ErrorResponse, TBody, TQuery> => {
  return async (
    req: Request<TParams, TResponse, TBody, TQuery>,
    res: Response<TResponse | ErrorResponse>,
    next: NextFunction,
  ) => {
    try {
      // Validate params if schema provided
      if (options.paramsSchema) {
        req.params = await options.paramsSchema.parseAsync(req.params)
      }

      // Validate query if schema provided
      if (options.querySchema) {
        req.query = await options.querySchema.parseAsync(req.query)
      }

      // Validate body if schema provided
      if (options.bodySchema) {
        req.body = await options.bodySchema.parseAsync(req.body)
      }

      // Wrap original res.json to validate response
      if (options.responseSchema) {
        const originalJson = res.json.bind(res)
        res.json = (data: unknown) => {
          const validated = options.responseSchema?.parse(data)
          return originalJson(validated)
        }
      }

      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.info({
          msg: 'Validation error',
          event: 'validation_error',
          metadata: { error },
        })
        res.status(400).json({
          error: 'Invalid request data',
          message: 'Invalid request data',
          details: error.errors,
        })
      } else {
        logger.error({
          msg: 'Validation middleware error',
          event: 'validation_middleware_error',
          metadata: { error },
        })
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to validate request',
        })
      }
    }
  }
}
