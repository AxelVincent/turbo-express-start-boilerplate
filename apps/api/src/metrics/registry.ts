import { createMetricsRegistry } from "@repo/metrics"
import { APP_SLUG, METRIC_PREFIX } from "../config/service"

export const metricsRegistry = createMetricsRegistry({
  prefix: METRIC_PREFIX,
  defaultLabels: {
    app: APP_SLUG,
    environment: process.env.NODE_ENV || "development",
  },
  collectDefaultMetrics: true,
})
