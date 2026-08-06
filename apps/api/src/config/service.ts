/**
 * This service's identity, in one place.
 *
 * Change APP_SLUG when you fork this boilerplate and every metric name, metric
 * label and the default trace/log service name follow. Nothing else in the API
 * should hardcode the project name.
 */
export const APP_SLUG = "boilerplate"

/** Prefix for every Prometheus metric this service exposes. */
export const METRIC_PREFIX = `${APP_SLUG}_`

/**
 * Name this service reports to Tempo and Loki. Overridable per environment so
 * staging and production can be told apart without a rebuild.
 */
export const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || `${APP_SLUG}-api`
