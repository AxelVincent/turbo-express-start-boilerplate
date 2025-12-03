import { Registry, collectDefaultMetrics } from 'prom-client'
import type { MetricsRegistryOptions } from './types'

/**
 * Creates a Prometheus registry with optional configuration
 */
export const createMetricsRegistry = (
  options: MetricsRegistryOptions = {},
): Registry => {
  const {
    prefix = 'app_',
    defaultLabels = {},
    collectDefaultMetrics: shouldCollectDefaults = true,
  } = options

  const registry = new Registry()

  // Set default labels if provided
  if (Object.keys(defaultLabels).length > 0) {
    registry.setDefaultLabels(defaultLabels)
  }

  // Collect default Node.js metrics
  if (shouldCollectDefaults) {
    collectDefaultMetrics({
      register: registry,
      prefix: `${prefix}nodejs_`,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    })
  }

  return registry
}

// Re-export prom-client types and classes
export { Registry, Counter, Gauge, Histogram, Summary } from 'prom-client'
