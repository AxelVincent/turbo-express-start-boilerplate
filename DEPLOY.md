# Deploying to Railway

This is a **shared** monorepo — `apps/*` depend on `packages/*` — so each service
builds from the repository root using its own Dockerfile, which runs
`turbo prune` to isolate just what that service needs. Railway's per-service
"Root Directory" setting is for _isolated_ monorepos and should be left at the
repo root here.

Build and deploy behaviour lives in `apps/api/railway.json` and
`apps/front/railway.json`. Config in the repo overrides the dashboard, so those
files are the source of truth once you point each service at them.

---

## One-time project setup

1. Create an empty Railway project.
2. Add two **empty** services named `api` and `front` (create them empty rather
   than deploying from GitHub, so you can configure them before the first
   build).
3. Connect this repository to each service.
4. On each service → Settings → Config-as-code, set the config file path:
   - `api` → `apps/api/railway.json`
   - `front` → `apps/front/railway.json`
5. Add the managed datastores you need — Railway's Postgres and Redis plugins
   both work with the variables the API already reads.
6. Generate a public domain for each service.

### Variables

The API reads discrete `PG*` variables rather than a single `DATABASE_URL`, so
map Railway's Postgres plugin onto them with reference variables:

| API variable     | Value                      |
| ---------------- | -------------------------- |
| `PGHOST`         | `${{Postgres.PGHOST}}`     |
| `PGPORT`         | `${{Postgres.PGPORT}}`     |
| `PGUSER`         | `${{Postgres.PGUSER}}`     |
| `PGPASSWORD`     | `${{Postgres.PGPASSWORD}}` |
| `PGDATABASE`     | `${{Postgres.PGDATABASE}}` |
| `REDIS_HOST`     | `${{Redis.REDISHOST}}`     |
| `REDIS_PORT`     | `${{Redis.REDISPORT}}`     |
| `REDIS_PASSWORD` | `${{Redis.REDISPASSWORD}}` |

Then set the rest by hand:

| Variable              | Notes                                                                           |
| --------------------- | ------------------------------------------------------------------------------- |
| `NODE_ENV`            | `production` — anything but `development` enables S3 storage and Slack alerting |
| `BETTER_AUTH_SECRET`  | fresh, 32+ chars (`openssl rand -base64 32`)                                    |
| `INTERNAL_RPC_SECRET` | fresh, 32+ chars                                                                |
| `BASE_URL`            | `https://${{RAILWAY_PUBLIC_DOMAIN}}`                                            |
| `FRONTEND_BASE_URL`   | `https://${{front.RAILWAY_PUBLIC_DOMAIN}}`                                      |
| `OTEL_SERVICE_NAME`   | names this service in both Tempo and Loki                                       |
| `S3_*`                | required outside development — see `apps/api/.env.example`                      |

Do **not** set `PORT`. Railway assigns it and the API binds whatever it is
given.

### The frontend's API URL is a build argument, not a runtime variable

Vite inlines `VITE_API_URL` into the bundle at build time. Setting it only at
runtime leaves the deployed frontend calling `http://localhost:3030`, which is
the most common first-deploy failure here.

Set it as a service variable on `front`:

```
VITE_API_URL = https://${{api.RAILWAY_PUBLIC_DOMAIN}}
```

`apps/front/Dockerfile` already declares the matching `ARG VITE_API_URL`, so
Railway passes it through to the build. Changing it requires a rebuild, not a
restart.

---

## Deploying

### Option A — Railway watches the repo

With the repository connected, Railway rebuilds on every push to the tracked
branch. The `watchPatterns` in each `railway.json` mean a change under
`apps/api/**` doesn't rebuild the frontend, and vice versa; a change under
`packages/**` rebuilds both, which is correct because both depend on them.

Nothing else to configure — but note that Railway will deploy a commit whose
tests fail, because it never runs them.

### Option B — GitHub Actions gates the deploy

`.github/workflows/ci.yml` runs format, lint, typecheck, unit tests, build and
the integration suite (against service containers), and only then calls
`railway up`. To use it:

1. Railway → project → Settings → Tokens → create a **project token**.
2. GitHub → repo → Settings → Secrets → Actions → add `RAILWAY_TOKEN`.
3. Turn **off** Railway's automatic deploys for both services, or you get two
   deploys per push — one gated, one not.

The deploy job uses `railway up --ci`, which streams the build and exits
non-zero if it fails, so a broken build shows as a red workflow rather than a
silent bad release.

---

## Migrations

`apps/api/railway.json` runs migrations in `preDeployCommand`, which executes
against the new build _before_ it receives traffic — a failing migration aborts
the deploy and leaves the previous version serving.

```json
"preDeployCommand": ["pnpm --filter @repo/api db:migrate"]
```

Confirm this on your first deploy: it depends on `kysely-ctl` and the migration
sources being present in the runner image, which they are with the current
Dockerfile. If you move to a slimmer runtime image, either keep those files or
move migrations into the CI job instead.

## Zero-downtime and shutdown

`overlapSeconds: 20` keeps the old deployment serving while the new one starts.
`drainingSeconds: 15` is the SIGTERM → SIGKILL window; the API's shutdown
handler closes the listener, drains connections, closes the pool and flushes
traces, with its own 5s backstop, so it exits well inside that window.

## Observability

`prometheus.yml` scrapes `host.docker.internal:3030`, which only resolves on a
developer machine. If you run Prometheus on Railway, point it at the API's
private address instead:

```yaml
targets: ["api.railway.internal:3030"]
```

Railway's private network is per-project, so a shared Grafana in another
project reaches this one over its public domain, not `*.railway.internal`.

---

## Turning this into a reusable Railway template

Railway templates are not files you can commit — there is no template format in
the repo. A template is generated **from a working project**, so the setup above
has to exist first. Once it does:

1. Project → Settings → **Generate Template from Project** → Create Template.
2. In the composer, replace concrete secrets with generated ones so each fork
   gets its own: `${{ secret(32) }}` for `BETTER_AUTH_SECRET` and
   `INTERNAL_RPC_SECRET`.
3. Check that the service source points at the branch you want
   (`https://github.com/<you>/<repo>/tree/<branch>`).
4. Workspace → Templates → **Publish**.

Deploying that template then provisions api, front, Postgres and Redis wired
together in one click — which is the fastest path to standing up the next
project. Keep the template's repo URL pointed at this boilerplate rather than at
a product built from it, or forks inherit the wrong code.
