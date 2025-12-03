import { createMetricsRegistry } from '@repo/metrics'

export const metricsRegistry = createMetricsRegistry({
  prefix: 'boilerplate_',
  defaultLabels: {
    app: 'boilerplate',
    environment: process.env.NODE_ENV || 'development',
  },
  collectDefaultMetrics: true,
})
