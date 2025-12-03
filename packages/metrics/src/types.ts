import type { Request, Response } from 'express'

export interface MetricLabels {
  [key: string]: string | number
}

export interface HttpMetricOptions {
  /**
   * Metric name prefix (e.g., 'boilerplate_')
   * Default: '' (no prefix)
   */
  prefix?: string

  /**
   * Function to extract route pattern from request
   * Default: uses req.route?.path || req.path
   */
  routeExtractor?: (_req: Request) => string

  /**
   * Function to determine if request should be tracked
   * Default: tracks all requests
   */
  shouldTrack?: (_req: Request) => boolean

  /**
   * Additional labels to add to HTTP metrics
   */
  extraLabels?: (_req: Request, _res: Response) => MetricLabels
}

export interface MetricsRegistryOptions {
  /**
   * Prefix for all metrics
   * Default: 'app_'
   */
  prefix?: string

  /**
   * Default labels applied to all metrics
   */
  defaultLabels?: MetricLabels

  /**
   * Whether to collect default Node.js metrics
   * Default: true
   */
  collectDefaultMetrics?: boolean
}

/**
 * Timer for tracking duration with start/stop pattern
 */
export interface DurationTimer {
  /**
   * Stop the timer and record the duration
   * @param labels - Labels to attach to the metric
   */
  stop: (_labels?: Record<string, string>) => number

  /**
   * Get elapsed time without stopping the timer
   */
  elapsed: () => number
}
