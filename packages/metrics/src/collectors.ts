import { Counter, Gauge, Histogram, type Registry, Summary } from 'prom-client'

/**
 * Creates a counter metric
 */
export const createCounter = (
  registry: Registry,
  name: string,
  help: string,
  labelNames: string[] = [],
) => {
  return new Counter({
    name,
    help,
    labelNames,
    registers: [registry],
  })
}

/**
 * Creates a gauge metric
 */
export const createGauge = (
  registry: Registry,
  name: string,
  help: string,
  labelNames: string[] = [],
) => {
  return new Gauge({
    name,
    help,
    labelNames,
    registers: [registry],
  })
}

/**
 * Creates a histogram metric with configurable buckets
 */
export const createHistogram = (
  registry: Registry,
  name: string,
  help: string,
  labelNames: string[] = [],
  buckets?: number[],
) => {
  return new Histogram({
    name,
    help,
    labelNames,
    buckets,
    registers: [registry],
  })
}

/**
 * Creates a summary metric with configurable percentiles
 */
export const createSummary = (
  registry: Registry,
  name: string,
  help: string,
  labelNames: string[] = [],
  percentiles?: number[],
) => {
  return new Summary({
    name,
    help,
    labelNames,
    percentiles,
    registers: [registry],
  })
}

/**
 * Pre-configured histogram for HTTP request durations
 */
export const createHttpDurationHistogram = (
  registry: Registry,
  name = 'http_request_duration_seconds',
  labelNames: string[] = ['method', 'route', 'status_code'],
) => {
  return createHistogram(
    registry,
    name,
    'Duration of HTTP requests in seconds',
    labelNames,
    [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  )
}

/**
 * Pre-configured counter for HTTP requests
 */
export const createHttpRequestCounter = (
  registry: Registry,
  name = 'http_requests_total',
  labelNames: string[] = ['method', 'route', 'status_code'],
) => {
  return createCounter(
    registry,
    name,
    'Total number of HTTP requests',
    labelNames,
  )
}

/**
 * Pre-configured histogram for HTTP request sizes
 */
export const createHttpSizeHistogram = (
  registry: Registry,
  name = 'http_request_size_bytes',
  labelNames: string[] = ['method', 'route'],
  isResponse = false,
) => {
  return createHistogram(
    registry,
    isResponse ? name.replace('request', 'response') : name,
    isResponse
      ? 'Size of HTTP responses in bytes'
      : 'Size of HTTP requests in bytes',
    isResponse ? [...labelNames, 'status_code'] : labelNames,
    [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  )
}
