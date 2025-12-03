# @boilerplate/metrics

Pure utility package for Prometheus metrics in Node.js applications with Express.

## Installation

```bash
# In your app's package.json, add the dependency
{
  "dependencies": {
    "@boilerplate/metrics": "workspace:*"
  }
}

# Then install
pnpm install
```

## Quick Start

### 1. Create a Metrics Registry

```typescript
// src/metrics/registry.ts
import { createMetricsRegistry } from '@boilerplate/metrics'

export const metricsRegistry = createMetricsRegistry({
  prefix: 'myapp_',
  defaultLabels: {
    app: 'my-application',
    environment: process.env.NODE_ENV || 'development',
  },
  collectDefaultMetrics: true, // Collects Node.js metrics (CPU, memory, etc.)
})
```

### 2. Add HTTP Metrics to Express

```typescript
// src/index.ts
import express from 'express'
import { createHttpMetricsMiddleware, createMetricsHandler } from '@boilerplate/metrics'
import { metricsRegistry } from './metrics/registry'

const app = express()

// Add metrics middleware (before your routes)
app.use(
  createHttpMetricsMiddleware(metricsRegistry, {
    // Optional: customize route extraction
    routeExtractor: (req) => req.route?.path || req.path,

    // Optional: filter which requests to track
    shouldTrack: (req) => req.method !== 'OPTIONS',

    // Optional: add custom labels
    extraLabels: (req, res) => ({
      user_id: req.auth?.userId || 'anonymous',
    }),
  }),
)

// Your routes here
app.get('/api/users', (req, res) => { ... })

// Add metrics endpoint for Prometheus
app.get('/metrics', createMetricsHandler(metricsRegistry))

app.listen(3000)
```

### 3. Define Custom Metrics

```typescript
// src/metrics/collectors.ts
import { createCounter, createGauge, createHistogram } from '@boilerplate/metrics'
import { metricsRegistry } from './registry'

// Counter - monotonically increasing value
export const requestsCounter = createCounter(
  metricsRegistry,
  'myapp_requests_total',
  'Total number of requests',
  ['endpoint', 'status'], // Labels
)

// Gauge - value that can go up or down
export const activeConnectionsGauge = createGauge(
  metricsRegistry,
  'myapp_active_connections',
  'Number of active connections',
  ['type'],
)

// Histogram - for measuring durations/sizes
export const taskDurationHistogram = createHistogram(
  metricsRegistry,
  'myapp_task_duration_seconds',
  'Duration of tasks in seconds',
  ['task_type'],
  [0.1, 0.5, 1, 2, 5, 10, 30], // Buckets in seconds
)
```

---

## Usage Patterns

### Pattern 1: Duration Tracking with Start/Stop

**Use Case:** Track how long operations take

```typescript
import { startDurationTimer } from '@boilerplate/metrics'
import { taskDurationHistogram } from './metrics/collectors'

export const processTask = async (taskId: string) => {
  // ✅ Start timer - automatically records to histogram when stopped
  const timer = startDurationTimer(taskDurationHistogram)

  try {
    // Do your work
    const result = await performTask(taskId)

    // ✅ Stop timer with labels - returns duration in seconds
    const duration = timer.stop({
      task_type: 'data_processing',
      status: 'success',
    })

    console.log(`Task completed in ${duration}s`)
    return result

  } catch (error) {
    // ✅ Still record duration even on failure
    timer.stop({
      task_type: 'data_processing',
      status: 'failed',
    })

    throw error
  }
}
```

### Pattern 2: Manual Timer (Conditional Recording)

**Use Case:** Check elapsed time or conditionally record metrics

```typescript
import { startTimer } from '@boilerplate/metrics'
import { taskDurationHistogram } from './metrics/collectors'

export const processWithTimeout = async (taskId: string) => {
  // ✅ Generic timer - doesn't auto-record
  const timer = startTimer()

  for (const step of steps) {
    await processStep(step)

    // ✅ Check elapsed time without stopping
    const elapsed = timer.elapsed()

    // Timeout after 5 minutes
    if (elapsed > 300) {
      throw new Error('Task timeout')
    }

    // Log progress every 30 seconds
    if (elapsed > 30 && step % 10 === 0) {
      console.log(`Progress: ${step}/${steps.length} (${elapsed}s elapsed)`)
    }
  }

  // ✅ Manually record to histogram (conditional)
  const finalDuration = timer.stop()

  if (finalDuration > 10) {
    taskDurationHistogram.observe(
      { task_type: 'slow_processing' },
      finalDuration,
    )
  }

  return finalDuration
}
```

### Pattern 3: Multi-Step Duration Tracking

**Use Case:** Track duration of individual steps in a process

```typescript
import { startDurationTimer } from '@boilerplate/metrics'
import { taskDurationHistogram } from './metrics/collectors'

export const multiStepProcess = async (data: Data) => {
  // Track total duration
  const totalTimer = startDurationTimer(taskDurationHistogram)

  // Step 1: Validation
  const validateTimer = startDurationTimer(taskDurationHistogram)
  await validateData(data)
  validateTimer.stop({ task_type: 'validation', step: 'validate' })

  // Step 2: Processing
  const processTimer = startDurationTimer(taskDurationHistogram)
  const result = await processData(data)
  processTimer.stop({ task_type: 'validation', step: 'process' })

  // Step 3: Storage
  const storeTimer = startDurationTimer(taskDurationHistogram)
  await storeResult(result)
  storeTimer.stop({ task_type: 'validation', step: 'store' })

  // Record total duration
  totalTimer.stop({ task_type: 'validation', step: 'total' })

  return result
}
```

### Pattern 4: Counters

**Use Case:** Count events (requests, errors, operations)

```typescript
import { requestsCounter } from './metrics/collectors'

export const handleRequest = async (req: Request, res: Response) => {
  try {
    const result = await processRequest(req)

    // ✅ Increment counter with labels
    requestsCounter.inc({
      endpoint: '/api/users',
      status: 'success',
    })

    res.json(result)
  } catch (error) {
    requestsCounter.inc({
      endpoint: '/api/users',
      status: 'error',
    })

    res.status(500).json({ error: 'Internal error' })
  }
}
```

### Pattern 5: Gauges

**Use Case:** Track current state (active connections, queue size, memory usage)

```typescript
import { activeConnectionsGauge } from './metrics/collectors'

// When connection opens
socket.on('connect', () => {
  activeConnectionsGauge.inc({ type: 'websocket' })
})

// When connection closes
socket.on('disconnect', () => {
  activeConnectionsGauge.dec({ type: 'websocket' })
})

// Set to specific value
activeConnectionsGauge.set({ type: 'database' }, currentConnections)
```

---

## Pre-configured Helpers

### HTTP Duration Histogram

```typescript
import { createHttpDurationHistogram } from '@boilerplate/metrics'
import { metricsRegistry } from './metrics/registry'

const httpDuration = createHttpDurationHistogram(
  metricsRegistry,
  'http_request_duration_seconds', // Optional: defaults to this
  ['method', 'route', 'status_code'], // Optional: defaults to these
)
```

Default buckets: `[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]` seconds

### HTTP Request Counter

```typescript
import { createHttpRequestCounter } from '@boilerplate/metrics'
import { metricsRegistry } from './metrics/registry'

const httpRequests = createHttpRequestCounter(
  metricsRegistry,
  'http_requests_total', // Optional: defaults to this
  ['method', 'route', 'status_code'], // Optional: defaults to these
)
```

### HTTP Size Histograms

```typescript
import { createHttpSizeHistogram } from '@boilerplate/metrics'
import { metricsRegistry } from './metrics/registry'

// Request size
const requestSize = createHttpSizeHistogram(
  metricsRegistry,
  'http_request_size_bytes',
  ['method', 'route'],
  false, // isResponse
)

// Response size
const responseSize = createHttpSizeHistogram(
  metricsRegistry,
  'http_request_size_bytes',
  ['method', 'route'],
  true, // isResponse - will change name to http_response_size_bytes
)
```

Default buckets: `[100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000]` bytes

---

## API Reference

### Registry

#### `createMetricsRegistry(options?)`

Creates a Prometheus registry with Node.js metrics collection.

```typescript
interface MetricsRegistryOptions {
  prefix?: string                    // Default: 'app_'
  defaultLabels?: Record<string, string | number>
  collectDefaultMetrics?: boolean    // Default: true
}
```

**Example:**
```typescript
const registry = createMetricsRegistry({
  prefix: 'myapp_',
  defaultLabels: { app: 'api', env: 'production' },
  collectDefaultMetrics: true,
})
```

### Collectors

#### `createCounter(registry, name, help, labelNames?)`

Creates a counter metric (monotonically increasing).

```typescript
const counter = createCounter(
  registry,
  'requests_total',
  'Total number of requests',
  ['method', 'status'],
)

// Usage
counter.inc({ method: 'GET', status: '200' })
counter.inc({ method: 'POST', status: '201' }, 5) // Increment by 5
```

#### `createGauge(registry, name, help, labelNames?)`

Creates a gauge metric (can increase or decrease).

```typescript
const gauge = createGauge(
  registry,
  'queue_size',
  'Current queue size',
  ['queue_name'],
)

// Usage
gauge.inc({ queue_name: 'tasks' })           // Increment by 1
gauge.dec({ queue_name: 'tasks' })           // Decrement by 1
gauge.set({ queue_name: 'tasks' }, 42)       // Set to specific value
gauge.inc({ queue_name: 'tasks' }, 5)        // Increment by 5
gauge.dec({ queue_name: 'tasks' }, 3)        // Decrement by 3
```

#### `createHistogram(registry, name, help, labelNames?, buckets?)`

Creates a histogram metric (for distributions).

```typescript
const histogram = createHistogram(
  registry,
  'request_duration_seconds',
  'Request duration in seconds',
  ['endpoint'],
  [0.1, 0.5, 1, 2, 5], // Custom buckets
)

// Usage
histogram.observe({ endpoint: '/api/users' }, 0.234)
```

#### `createSummary(registry, name, help, labelNames?, percentiles?)`

Creates a summary metric (for quantiles).

```typescript
const summary = createSummary(
  registry,
  'request_size_bytes',
  'Request size in bytes',
  ['method'],
  [0.5, 0.9, 0.99], // Percentiles
)

// Usage
summary.observe({ method: 'POST' }, 1024)
```

### Middleware

#### `createHttpMetricsMiddleware(registry, options?)`

Express middleware for automatic HTTP metrics.

```typescript
interface HttpMetricOptions {
  routeExtractor?: (req: Request) => string
  shouldTrack?: (req: Request) => boolean
  extraLabels?: (req: Request, res: Response) => Record<string, string>
}
```

**Example:**
```typescript
app.use(
  createHttpMetricsMiddleware(registry, {
    routeExtractor: (req) => req.route?.path || req.path,
    shouldTrack: (req) => req.method !== 'OPTIONS',
    extraLabels: (req, res) => ({
      user_id: req.user?.id || 'anonymous',
      api_version: 'v1',
    }),
  }),
)
```

**Metrics Created:**
- `http_request_duration_seconds` - Histogram of request durations
- `http_requests_total` - Counter of total requests
- `http_request_size_bytes` - Histogram of request sizes
- `http_response_size_bytes` - Histogram of response sizes

#### `createMetricsHandler(registry)`

Express handler for `/metrics` endpoint.

```typescript
app.get('/metrics', createMetricsHandler(registry))
```

### Timers

#### `startDurationTimer(histogram): DurationTimer`

Starts a timer that automatically records to a histogram.

```typescript
const timer = startDurationTimer(myHistogram)

// Later...
const duration = timer.stop({ label: 'value' }) // Returns duration in seconds
const elapsed = timer.elapsed() // Check elapsed time without stopping
```

#### `startTimer(): DurationTimer`

Starts a generic timer (no auto-recording).

```typescript
const timer = startTimer()

// Later...
const duration = timer.stop() // Returns duration in seconds
const elapsed = timer.elapsed() // Check elapsed time without stopping

// Manually record if needed
myHistogram.observe({ label: 'value' }, duration)
```

**DurationTimer Interface:**
```typescript
interface DurationTimer {
  stop: (labels?: Record<string, string>) => number  // Returns seconds
  elapsed: () => number                               // Returns seconds
}
```

---

## Prometheus Setup

### 1. Create `prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'my-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

### 2. Run Prometheus

**Docker:**
```bash
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

**Docker Compose:**
```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### 3. Access Metrics

- **Application metrics:** http://localhost:3000/metrics
- **Prometheus UI:** http://localhost:9090

---

## Grafana Setup

### 1. Add to `docker-compose.yml`

```yaml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3200:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  grafana-data:
```

### 2. Configure Datasource

Create `grafana/provisioning/datasources/datasources.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

### 3. Access Grafana

- **URL:** http://localhost:3200
- **Credentials:** admin / admin

---

## Common PromQL Queries

### Request Rate
```promql
rate(myapp_http_requests_total[5m])
```

### Request Duration P95
```promql
histogram_quantile(0.95, rate(myapp_http_request_duration_seconds_bucket[5m]))
```

### Error Rate
```promql
rate(myapp_http_requests_total{status_code=~"5.."}[5m])
```

### Success Rate
```promql
rate(myapp_http_requests_total{status_code=~"2.."}[5m]) /
rate(myapp_http_requests_total[5m])
```

### Active Connections
```promql
myapp_active_connections
```

### Memory Usage
```promql
myapp_nodejs_process_resident_memory_bytes
```

---

## Best Practices

### 1. Naming Conventions

- **Counters:** Use `_total` suffix (e.g., `requests_total`)
- **Gauges:** No suffix (e.g., `active_connections`)
- **Histograms/Summaries:** Use unit suffix (e.g., `duration_seconds`, `size_bytes`)
- **Prefix:** Use app prefix (e.g., `myapp_`)

### 2. Labels

- **Use labels sparingly** - Each unique combination creates a new time series
- **Avoid high-cardinality labels** - Don't use IDs, timestamps, or unbounded values
- **Good labels:** `method`, `status_code`, `endpoint`, `version`
- **Bad labels:** `user_id`, `request_id`, `timestamp`

### 3. Bucket Sizing

Choose buckets based on expected values:

```typescript
// Fast operations (milliseconds to seconds)
[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]

// Medium operations (seconds to minutes)
[0.1, 0.5, 1, 2, 5, 10, 30, 60, 120]

// Slow operations (minutes)
[1, 5, 10, 30, 60, 300, 600]

// Sizes (bytes)
[100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000]
```

### 4. Performance

- **Track duration once** - Don't create multiple timers for the same operation
- **Batch operations** - Consider tracking batch size instead of individual items
- **Use gauges for state** - Better than counters for current values

---

## TypeScript Types

All exports are fully typed:

```typescript
import type {
  MetricLabels,
  HttpMetricOptions,
  MetricsRegistryOptions,
  DurationTimer,
} from '@boilerplate/metrics'

import type {
  Registry,
  Counter,
  Gauge,
  Histogram,
  Summary,
} from '@boilerplate/metrics'
```

---

## Troubleshooting

### Metrics not appearing in Prometheus

1. Check metrics endpoint is accessible:
   ```bash
   curl http://localhost:3000/metrics
   ```

2. Verify Prometheus configuration:
   ```bash
   # Check targets status
   curl http://localhost:9090/api/v1/targets
   ```

3. Check Prometheus logs:
   ```bash
   docker logs prometheus
   ```

### High memory usage

- **Reduce label cardinality** - Remove high-cardinality labels
- **Use appropriate metric types** - Histograms use more memory than counters
- **Set retention limits** in Prometheus

### Duplicate metrics error

- **Ensure unique metric names** across your application
- **Don't create metrics in request handlers** - Create them once at startup

---

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
