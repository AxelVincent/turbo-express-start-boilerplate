# boilerplate Metrics Implementation - Comprehensive Overview

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Metrics Categories](#metrics-categories)
3. [Dashboard Structure](#dashboard-structure)
4. [Implementation Patterns](#implementation-patterns)
5. [Available Metrics Reference](#available-metrics-reference)
6. [Best Practices](#best-practices)

---

## 🏗️ Architecture Overview

### Stack Components

- **Metrics Collection**: Prometheus (`prom-client`)
- **Storage**: Prometheus Time-Series Database
- **Visualization**: Grafana
- **Package**: Custom `@boilerplate/metrics` package
- **Export**: HTTP endpoint at `/metrics`

### Data Flow

```
Application Code
    ↓
@boilerplate/metrics helpers (startEnrichmentTracking, trackExternalApiCall, etc.)
    ↓
prom-client collectors (Counter, Gauge, Histogram)
    ↓
Prometheus scrapes /metrics endpoint every 10s
    ↓
Grafana queries Prometheus
    ↓
Dashboard visualization
```

### Key Files

- **Registry**: `apps/api/src/metrics/registry.ts` - Central metrics registry
- **Collectors**: `apps/api/src/metrics/collectors.ts` - All metric definitions
- **Helpers**: `apps/api/src/metrics/*.ts` - Tracking utilities
- **Package**: `packages/metrics/src/` - Reusable metrics framework
- **Dashboard**: `packages/metrics/grafana/provisioning/dashboards/json/boilerplate-overview.json`

---

## 📊 Metrics Categories

### 1. HTTP Metrics 🌐

**Automatically tracked via Express middleware**

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `boilerplate_http_requests_total` | Counter | method, route, status_code | Total request count |
| `boilerplate_http_request_duration_seconds` | Histogram | method, route, status_code | Request latency (P50/P95/P99) |
| `boilerplate_http_request_size_bytes` | Histogram | method, route | Request payload size |
| `boilerplate_http_response_size_bytes` | Histogram | method, route, status_code | Response payload size |

**Implementation**:
```typescript
// In apps/api/src/index.ts
app.use(
  createHttpMetricsMiddleware(metricsRegistry, {
    prefix: 'boilerplate_',
    routeExtractor: (req) => req.route?.path || req.path,
    shouldTrack: (req) => req.method !== 'OPTIONS',
  })
)
```

---

### 2. Enrichment Metrics 🔄

**Tracks the core business logic of enriching company/website data**

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `boilerplate_enrichment_requests_total` | Counter | enrichment_type, status, cached | Success/failure count |
| `boilerplate_enrichment_duration_seconds` | Histogram | enrichment_type, subprocess, cached | Duration tracking with sub-steps |
| `boilerplate_enrichment_errors_total` | Counter | enrichment_type, error_type | Error categorization |
| `boilerplate_enrichment_active` | Gauge | status | Active enrichments (processing/completed/failed) |

**Enrichment Types**:
- `website` - Website data enrichment
- `governmental` - Government database lookups
- `social_media` - Social media data enrichment

**Sub-processes tracked**:
- `overall` - Complete enrichment operation
- `scrape_homepage` - Initial homepage scraping
- `scrape_subpages` - Additional pages scraping
- `technology_detection` - Website technology detection
- `governmental_data` - Company search in governmental databases
- `company_officers` - Company officers enrichment
- `website_description` - LLM-generated website description
- `whois_lookup` - Domain registration data lookup
- `email_verification` - Email validation
- `populate_contacts` - Contact generation
- `calculate_score` - Enrichment quality scoring

**Implementation Pattern**:
```typescript
import { startEnrichmentTracking } from '@/metrics/enrichment'

export const websiteEnrichmentManager = async ({ userPlaceId }) => {
  const tracker = startEnrichmentTracking('website', false)

  try {
    // Track individual sub-processes
    const homepage = await tracker.trackSubprocess('scrape_homepage', async () => {
      return await scrapeHomepage(url)
    })

    await tracker.trackSubprocess('governmental_data', async () => {
      return await enrichGovernmentalData({ place, enrichmentId })
    })

    // Mark as successful
    tracker.markSuccess()
  } catch (error) {
    tracker.markFailure(error)
    throw error
  }
}
```

---

### 3. Queue Metrics (BullMQ) 📦

**Tracks asynchronous job processing**

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `boilerplate_queue_jobs_processed_total` | Counter | queue_name, job_type, status | Job completion tracking |
| `boilerplate_queue_job_duration_seconds` | Histogram | queue_name, job_type | Job processing time |
| `boilerplate_queue_jobs_failed_total` | Counter | queue_name, job_type, error_type | Failed job tracking |
| `boilerplate_queue_active_jobs` | Gauge | queue_name | Currently processing jobs |

**Implementation Pattern**:
```typescript
import { setupQueueMetrics, trackJobDuration } from '@/metrics/queue'

// Automatic worker instrumentation
const worker = new Worker(queueName, async (job) => {
  const timer = trackJobDuration('scraper', 'website_scrape')

  try {
    await processJob(job)
    timer.stop()
  } catch (error) {
    timer.stop()
    throw error
  }
}, config)

setupQueueMetrics(worker, 'scraper', 'website_scrape')
```

---

### 4. Database Metrics 💾

**Tracks PostgreSQL query performance - FULLY AUTOMATIC**

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `boilerplate_database_queries_total` | Counter | operation, table | Query count by operation type |
| `boilerplate_database_query_duration_seconds` | Histogram | operation, table | Query latency (P50/P95/P99) |

**Operations tracked**: `select`, `insert`, `update`, `delete`, `transaction`

**✨ Automatic Monitoring - No Code Changes Needed**:
```typescript
// Every query is automatically tracked via postgres client hook!

// This is tracked automatically:
const places = await db.select().from(places).where(eq(places.id, id))

// So is this:
await db.insert(users).values(newUser)

// And transactions:
await db.transaction(async (tx) => {
  await tx.insert(users).values(user)
  await tx.insert(profiles).values(profile)
})

// Even raw SQL:
await db.execute(sql`SELECT * FROM places WHERE active = true`)
```

**How it works**: Uses PostgreSQL client's `debug` hook to intercept ALL queries at the driver level.

**Implementation**: `apps/api/src/db/db-monitoring.ts` + `apps/api/src/db/db.ts`

**Benefits**:
- ✅ 100% query coverage
- ✅ Zero code changes required
- ✅ Accurate timing at driver level
- ✅ Automatic table detection
- ✅ Works with Drizzle, raw SQL, transactions

**Optional Helpers** (for better visibility):
```typescript
import { monitoredTransaction, monitoredBatchOperation } from '@/db/db'

// Named transaction tracking
await monitoredTransaction('user_onboarding', async () => {
  await db.transaction(async (tx) => { ... })
})

// Batch operation tracking
await monitoredBatchOperation('places', 'insert', items.length, async () => {
  await db.insert(places).values(items)
})
```

---

### 5. External API Metrics 🌍

**Tracks third-party service calls**

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `boilerplate_external_api_requests_total` | Counter | service, endpoint, status_code | API call tracking |
| `boilerplate_external_api_duration_seconds` | Histogram | service, endpoint | API latency |

**Services tracked**: Google Maps, Pappers, Icypeas, ContactOut, Firecrawl, Forager, Million Verifier, BrightData, WhoIs, etc.

**Implementation Pattern**:
```typescript
import { trackExternalApiCall } from '@/metrics/external-api'

export const searchGooglePlace = async (query: string) => {
  return trackExternalApiCall('google_maps', 'text_search', async () => {
    return await googleMapsClient.textSearch({ query })
  })
}
```

---

### 6. WebSocket Metrics 🔌

**Tracks real-time connection metrics**

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `boilerplate_websocket_connections` | Gauge | namespace | Active WebSocket connections |
| `boilerplate_websocket_messages_total` | Counter | namespace, event_type, direction | Message throughput |

**Directions**: `inbound`, `outbound`

---

### 7. Node.js Runtime Metrics ⚙️

**Automatically collected by `prom-client`**

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `boilerplate_nodejs_process_cpu_seconds_total` | Counter | - | CPU time consumed |
| `boilerplate_nodejs_process_resident_memory_bytes` | Gauge | - | Resident memory size |
| `boilerplate_nodejs_heap_size_total_bytes` | Gauge | - | Total heap size |
| `boilerplate_nodejs_heap_size_used_bytes` | Gauge | - | Used heap size |
| `boilerplate_nodejs_eventloop_lag_seconds` | Gauge | - | Event loop lag |
| `boilerplate_nodejs_gc_duration_seconds` | Histogram | kind | Garbage collection duration |

**Auto-collected via**:
```typescript
export const metricsRegistry = createMetricsRegistry({
  prefix: 'boilerplate_',
  defaultLabels: {
    app: 'boilerplate',
    environment: process.env.NODE_ENV || 'development',
  },
  collectDefaultMetrics: true, // ← Enables Node.js metrics
})
```

---

## 📈 Dashboard Structure

### Overview Dashboard Sections

#### 1. System Health Overview (6 KPI Cards)
- **CPU Usage** - Real-time CPU utilization percentage
- **Memory Usage** - Heap memory usage percentage
- **Error Rate (5xx)** - HTTP 5xx error rate
- **P95 Request Latency** - 95th percentile response time
- **Request Rate** - Requests per second
- **Active Enrichments** - Currently processing enrichments

**Visual**: Stat panels with color thresholds (green/yellow/red)

#### 2. HTTP Traffic (4 Panels)
- **Request Rate by Endpoint** - Line graph of RPS per route
- **Request Duration (P95 & P99)** - Latency percentiles by route
- **Requests by Status Code** - Stacked area chart (2xx/4xx/5xx)
- **Average Request/Response Size** - Bandwidth monitoring

#### 3. Enrichment Processing (4 Panels)
- **Active Enrichments by Status** - Processing/completed/failed gauge
- **Enrichment Request Rate** - Requests by type and status
- **Enrichment Duration (P95)** - Overall enrichment performance
- **Enrichment Errors by Type** - Error categorization

#### 4. Queue Processing (4 Panels)
- **Active Queue Jobs** - Current job count by queue
- **Job Processing Rate** - Jobs/second by status
- **Job Duration (P95)** - Processing time percentiles
- **Job Failures by Error Type** - Failure categorization

#### 5. Database Performance (2 Panels)
- **Database Query Rate** - Queries/second by operation and table
- **Database Query Duration (P95)** - Query latency by operation

#### 6. External APIs & WebSockets (4 Panels)
- **External API Request Rate** - Requests by service and status
- **External API Duration (P95)** - API latency by service
- **WebSocket Connections** - Active connections by namespace
- **WebSocket Message Rate** - Messages/second by direction

#### 7. Node.js Runtime (2 Panels)
- **Memory Usage Breakdown** - Resident/heap total/heap used
- **Event Loop Lag & GC Duration** - Runtime health indicators

---

## 🛠️ Implementation Patterns

### Pattern 1: Automatic Middleware Tracking

**Use for**: HTTP requests, general middleware operations

```typescript
// Automatically tracks all HTTP requests
app.use(createHttpMetricsMiddleware(metricsRegistry, options))
```

**Benefits**: Zero-overhead, automatic tracking, no code changes needed

---

### Pattern 2: Wrapper Functions

**Use for**: External APIs, database queries, one-off operations

```typescript
// Wraps the operation and tracks metrics
const result = await trackExternalApiCall('service', 'endpoint', async () => {
  return await externalService.doSomething()
})
```

**Benefits**: Clean, minimal code changes, automatic error handling

---

### Pattern 3: Explicit Tracking with Timers

**Use for**: Complex operations, manual control, conditional tracking

```typescript
const timer = startDurationTimer(myHistogram)

try {
  await doComplexOperation()
  timer.stop({ status: 'success' })
} catch (error) {
  timer.stop({ status: 'failed' })
  throw error
}
```

**Benefits**: Full control, multiple stop points, conditional metrics

---

### Pattern 4: Comprehensive Trackers

**Use for**: Multi-step workflows, enrichment pipelines

```typescript
const tracker = startEnrichmentTracking('website', false)

try {
  // Track individual steps
  await tracker.trackSubprocess('scrape_homepage', async () => {
    return await scrapeHomepage(url)
  })

  await tracker.trackSubprocess('governmental_data', async () => {
    return await enrichGovernmentalData(data)
  })

  tracker.markSuccess()
} catch (error) {
  tracker.markFailure(error)
  throw error
}
```

**Benefits**: Sub-step tracking, automatic status management, rich context

---

### Pattern 5: Event-Based Tracking

**Use for**: Long-running processes, worker instrumentation

```typescript
// Attach to worker events
worker.on('active', (job) => {
  queueActiveJobsGauge.inc({ queue_name: queueName })
})

worker.on('completed', (job) => {
  queueActiveJobsGauge.dec({ queue_name: queueName })
  queueJobsProcessedCounter.inc({ queue_name, status: 'success' })
})
```

**Benefits**: Automatic lifecycle tracking, no manual intervention

---

## 📚 Available Metrics Reference

### Metric Types

| Type | Description | Use Case | Aggregations |
|------|-------------|----------|--------------|
| **Counter** | Monotonically increasing value | Request counts, errors, events | rate(), increase() |
| **Gauge** | Value that can go up or down | Active connections, memory, queue depth | N/A (absolute values) |
| **Histogram** | Distribution of values in buckets | Latency, request size, duration | histogram_quantile(), avg(), sum() |
| **Summary** | Similar to histogram with quantiles | Alternative to histogram | quantile() |

### Common PromQL Patterns

```promql
# Request rate (requests per second)
rate(boilerplate_http_requests_total[5m])

# Error rate percentage
sum(rate(boilerplate_http_requests_total{status_code=~"5.."}[5m])) /
sum(rate(boilerplate_http_requests_total[5m])) * 100

# P95 latency
histogram_quantile(0.95,
  sum(rate(boilerplate_http_request_duration_seconds_bucket[5m])) by (le, route)
)

# Average duration
rate(boilerplate_enrichment_duration_seconds_sum[5m]) /
rate(boilerplate_enrichment_duration_seconds_count[5m])

# Active jobs by queue
sum(boilerplate_queue_active_jobs) by (queue_name)

# Top 10 slowest endpoints
topk(10,
  histogram_quantile(0.95,
    sum(rate(boilerplate_http_request_duration_seconds_bucket[5m])) by (le, route)
  )
)
```

---

## ✅ Best Practices

### 1. Naming Conventions

- **Format**: `{namespace}_{subsystem}_{metric}_{unit}`
- **Example**: `boilerplate_http_requests_total`, `boilerplate_enrichment_duration_seconds`
- **Units**: Always include units in metric names (`_seconds`, `_bytes`, `_total`)

### 2. Label Usage

**Good labels** (low cardinality):
- `status` (success/failed)
- `operation` (select/insert/update/delete)
- `enrichment_type` (website/governmental/social_media)
- `queue_name` (scraper/enrichment/notification)

**Bad labels** (high cardinality):
- `user_id` (thousands of unique values)
- `timestamp` (infinite unique values)
- `url` (too many variations)
- `error_message` (unpredictable variations)

**Rule**: Labels should have <100 unique values

### 3. Performance Considerations

- **Histograms**: Define appropriate buckets for your use case
  - HTTP latency: `[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]`
  - Enrichment duration: `[0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300]`
- **Counters**: Use `rate()` in PromQL for per-second rates
- **Gauges**: Good for current state, not historical trends
- **Avoid**: High-frequency metric updates (>1000/sec per metric)

### 4. Error Handling

Always stop timers in both success and error paths:

```typescript
const timer = startDurationTimer(histogram)

try {
  const result = await operation()
  timer.stop({ status: 'success' })
  return result
} catch (error) {
  timer.stop({ status: 'failed', error_type: error.name })
  throw error
}
```

### 5. Enrichment Tracking

- Use `trackSubprocess()` for automatic tracking
- Always call `markSuccess()` or `markFailure()`
- Track the `overall` subprocess for complete operation time
- Use `cached` label to distinguish cached vs. fresh enrichments

### 6. Testing Metrics

```bash
# View raw metrics
curl http://localhost:3030/metrics

# Check specific metric
curl http://localhost:3030/metrics | grep boilerplate_enrichment_requests_total

# Query Prometheus directly
curl 'http://localhost:9090/api/v1/query?query=boilerplate_http_requests_total'
```

### 7. Dashboard Maintenance

- **Refresh rate**: 5-10 seconds for overview dashboards
- **Time range**: Last 1 hour for real-time monitoring
- **Thresholds**: Define meaningful thresholds (green <70%, yellow 70-90%, red >90%)
- **Legends**: Show mean/max/last in tables for context
- **Export**: Always export dashboard JSON to version control

### 8. Alerting Strategy

Focus on actionable alerts:

```yaml
# High error rate (critical)
sum(rate(boilerplate_http_requests_total{status_code=~"5.."}[5m])) /
sum(rate(boilerplate_http_requests_total[5m])) > 0.05

# High memory usage (warning)
(boilerplate_nodejs_heap_size_used_bytes / boilerplate_nodejs_heap_size_total_bytes) > 0.9

# Queue backlog (warning)
sum(boilerplate_queue_active_jobs) > 100
```

---

## 🔗 Quick Links

- **Grafana Dashboard**: http://localhost:3200/d/boilerplate-overview
- **Prometheus UI**: http://localhost:9090
- **Metrics Endpoint**: http://localhost:3030/metrics
- **Package Docs**: [packages/metrics/README.md](../README.md)
- **Dashboard Guide**: [GRAFANA_DASHBOARDS_GUIDE.md](./grafana/GRAFANA_DASHBOARDS_GUIDE.md)

---

## 📊 Metrics Summary

| Category | Metrics Count | Key Focus |
|----------|---------------|-----------|
| HTTP | 4 | Request rate, latency, errors |
| Enrichment | 4 | Processing time, success rate, errors |
| Queue | 4 | Job throughput, duration, failures |
| Database | 2 | Query rate, latency |
| External APIs | 2 | Request rate, latency |
| WebSocket | 2 | Connections, message throughput |
| Node.js Runtime | 6+ | CPU, memory, GC, event loop |
| **Total** | **24+** | **Full-stack observability** |

---

**Last Updated**: November 24, 2025
**Version**: 1.0.0
**Maintained by**: boilerplate Team
