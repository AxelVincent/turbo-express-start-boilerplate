import { createCounter, createGauge, createHistogram } from "@repo/metrics"
import { metricsRegistry } from "./registry"
import { METRIC_PREFIX } from "../config/service"

// ============================================
// USER METRICS
// ============================================

export const activeUsersGauge = createGauge(
  metricsRegistry,
  `${METRIC_PREFIX}active_users`,
  "Number of currently active users",
)

export const userOperationsCounter = createCounter(
  metricsRegistry,
  `${METRIC_PREFIX}user_operations_total`,
  "Total number of user operations",
  ["operation_type", "status"],
)

// ============================================
// DATABASE METRICS
// ============================================

export const databaseQueriesCounter = createCounter(
  metricsRegistry,
  `${METRIC_PREFIX}database_queries_total`,
  "Total number of database queries",
  ["operation", "table"],
)

export const databaseQueryDurationHistogram = createHistogram(
  metricsRegistry,
  `${METRIC_PREFIX}database_query_duration_seconds`,
  "Duration of database queries",
  ["operation", "table"],
  [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
)

// ============================================
// QUEUE METRICS (BullMQ)
// ============================================

export const queueJobsProcessedCounter = createCounter(
  metricsRegistry,
  `${METRIC_PREFIX}queue_jobs_processed_total`,
  "Total number of queue jobs processed",
  ["queue_name", "job_type", "status"],
)

export const queueJobDurationHistogram = createHistogram(
  metricsRegistry,
  `${METRIC_PREFIX}queue_job_duration_seconds`,
  "Duration of queue job processing",
  ["queue_name", "job_type"],
  [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
)

export const queueJobsFailedCounter = createCounter(
  metricsRegistry,
  `${METRIC_PREFIX}queue_jobs_failed_total`,
  "Total number of failed queue jobs",
  ["queue_name", "job_type", "error_type"],
)

export const queueActiveJobsGauge = createGauge(
  metricsRegistry,
  `${METRIC_PREFIX}queue_active_jobs`,
  "Number of currently active jobs in queue",
  ["queue_name"],
)

// ============================================
// WEBSOCKET METRICS
// ============================================

export const websocketConnectionsGauge = createGauge(
  metricsRegistry,
  `${METRIC_PREFIX}websocket_connections`,
  "Number of active WebSocket connections",
  ["namespace"],
)

export const websocketMessagesCounter = createCounter(
  metricsRegistry,
  `${METRIC_PREFIX}websocket_messages_total`,
  "Total number of WebSocket messages",
  ["namespace", "event_type", "direction"], // direction: inbound/outbound
)

// ============================================
// EXTERNAL API METRICS
// ============================================

export const externalApiRequestsCounter = createCounter(
  metricsRegistry,
  `${METRIC_PREFIX}external_api_requests_total`,
  "Total number of external API requests",
  ["service", "endpoint", "status_code"],
)

export const externalApiDurationHistogram = createHistogram(
  metricsRegistry,
  `${METRIC_PREFIX}external_api_duration_seconds`,
  "Duration of external API requests",
  ["service", "endpoint"],
  [0.1, 0.5, 1, 2, 5, 10, 30],
)
