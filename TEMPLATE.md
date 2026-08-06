# Deploy and Host JXLR Boilerplate on Railway

JXLR Boilerplate is a production-ready full-stack TypeScript monorepo. It ships an
Express API with type-safe Zod contracts shared with the frontend, React 19 with
TanStack Router and Query, PostgreSQL via Kysely, Redis-backed jobs, S3 object
storage, multi-organisation authentication, and a complete Grafana observability
stack — everything a new product needs on day one.

## About Hosting JXLR Boilerplate

Hosting involves ten services wired together: the API and frontend, each built from
its own Dockerfile inside a shared pnpm monorepo; a Caddy reverse proxy that gives
both a single public domain; PostgreSQL, Redis and an S3-compatible bucket; and
Grafana, Loki, Prometheus and Tempo for logs, metrics and traces. Railway's
reference variables connect everything over private networking, so no credentials
are copied by hand. Database migrations run as a pre-deploy step and abort the
release if they fail, auth secrets are generated per deployment, and volumes
persist your database and observability data. Nothing requires configuration
before the first deploy.

## Common Use Cases

- Launching a new multi-tenant SaaS product without rebuilding auth, organisations, user management and an admin backoffice from scratch
- Standing up an internal tool or client dashboard that needs real authentication, file uploads and audit-quality logging on day one
- Running a reference full-stack architecture with logs, metrics and distributed traces already correlated in Grafana

## Dependencies for JXLR Boilerplate Hosting

- **PostgreSQL** — primary datastore, schema managed by Kysely migrations
- **Redis** — background job queue and distributed rate limiting
- **S3-compatible object storage** — file uploads via presigned URLs
- **Caddy reverse proxy** — single public domain, routing `/api/*` to the backend
- **Grafana + Loki + Prometheus + Tempo** — the observability stack

### Deployment Dependencies

- [JXLR Boilerplate repository](https://github.com/AxelVincent/turbo-express-start-boilerplate)
- [Better Auth](https://www.better-auth.com) — authentication with the organization plugin
- [Kysely](https://kysely.dev) — type-safe SQL and migrations
- [TanStack Start](https://tanstack.com/start) — the React framework powering the frontend
- [Caddy Reverse Proxy template](https://github.com/railwayapp-templates/caddy-reverse-proxy)
- [Grafana Stack (Cost Efficient) template](https://github.com/AxelVincent/railway-grafana-stack-cost-efficient)
- [Resend](https://resend.com) — optional, for transactional email
- [OpenTelemetry](https://opentelemetry.io) — trace export to Tempo

### Implementation Details

**Single domain, path-routed.** Caddy uses `handle_path {$BACKEND_PATH:/api}/*`,
which strips the prefix before proxying. The browser calls
`https://<domain>/api/web/users`; the API receives `/web/users`. Frontend and API
are same-origin, so session cookies work without CORS.

```
VITE_API_URL = https://${{Caddy Proxy.RAILWAY_PUBLIC_DOMAIN}}/api
BASE_URL     = https://${{Caddy Proxy.RAILWAY_PUBLIC_DOMAIN}}/api
```

`VITE_API_URL` is inlined by Vite at **build** time, so changing it requires a
rebuild rather than a restart.

**Migrations gate the release.** `apps/api/railway.json` runs them before the new
build takes traffic, so a failed migration leaves the previous version serving:

```json
"deploy": {
  "preDeployCommand": ["pnpm --filter @repo/api db:migrate"],
  "healthcheckPath": "/health",
  "drainingSeconds": 15,
  "overlapSeconds": 20
}
```

**Graceful shutdown.** On SIGTERM the API stops accepting connections, closes idle
keep-alive sockets, closes the database pool and flushes pending traces, with a 5s
backstop — comfortably inside Railway's draining window.

**Secrets are generated, not shared.** `BETTER_AUTH_SECRET`, `INTERNAL_RPC_SECRET`
and the Grafana admin password use `${{ secret(n) }}`, so every deployment of this
template mints its own.

**Region.** Railway templates cannot prompt for a region, so set your account's
preferred region _before_ deploying and all ten services land together — which
matters here, because the API talks to Postgres, Redis and Tempo over private
networking. The five volume-backed services cannot be moved after provisioning,
so choose before the first deploy.

**Monorepo builds.** Railway only auto-detects config as code at the repo root,
and the per-service config path cannot be set from a template — so `api` and
`front` each carry `RAILWAY_DOCKERFILE_PATH` pointing at their own Dockerfile.
That selects the Dockerfile builder instead of Railpack, which would otherwise
fail on the workspace root for want of a start script.

**Optional integrations.** Email (`RESEND_API_KEY`), Slack error alerting
(`SLACK_BOT_TOKEN`) and Google OAuth are unset by default. The app degrades
cleanly without them — email logs to stdout and Slack alerting no-ops.

## Why Deploy JXLR Boilerplate on Railway?

<!-- Recommended: Keep this section as shown below -->

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying JXLR Boilerplate on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.

<!-- End recommended section -->
