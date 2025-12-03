import {
    createHttpMetricsMiddleware,
  } from '@repo/metrics'
import { metricsRegistry } from '../metrics/registry';

export const httpMetricsMiddleware = createHttpMetricsMiddleware(metricsRegistry, {
    prefix: 'boilerplate_',
    routeExtractor: (req) => {
      // Express doesn't provide route patterns for nested routers in req.baseUrl
      // req.baseUrl contains actual values like "/web/places/123abc/notes"
      // We need to reconstruct the pattern by replacing param values with placeholders

      if (!req.route) {
        return req.path
      }

      // Get the full actual path (baseUrl + route.path)
      const actualPath = req.baseUrl + req.route.path

      // Replace all parameter values with their :paramName placeholders
      let pattern = actualPath

      for (const [paramName, paramValue] of Object.entries(req.params)) {
        // Replace the actual value with :paramName placeholder
        // Use a regex to only replace full path segments
        const valueStr = String(paramValue)
        pattern = pattern.replace(
          new RegExp(`/${valueStr}(?=/|$)`, 'g'),
          `/:${paramName}`,
        )
      }

      return pattern
    },
    shouldTrack: (req) => req.method !== 'OPTIONS',
    // Note: We don't include user_id in labels to avoid cardinality explosion
    // (one metric series per user would be too many for Prometheus)
    // User-specific metrics should be tracked separately if needed
    extraLabels: () => ({}),
  });