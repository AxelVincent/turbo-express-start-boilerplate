# Scaffold a new project from this boilerplate

This file is a prompt. Paste it into Claude Code (or follow it by hand) in a
fresh copy of this boilerplate. It renames the project and moves every port off
the defaults, so several projects built from this boilerplate can run side by
side.

**Get the copy first.** Use GitHub's **Use this template** button rather than a
fork or a clone-and-push: it gives you a new repo with a single clean commit, no
"forked from" link, and the option to be private. A fork drags the whole
boilerplate history along and points its pull requests back at upstream.

From the CLI:

```bash
gh repo create my-project --template AxelVincent/turbo-express-start-boilerplate --private --clone
```

This creates the `my-project` repository on your GitHub account from the
template and clones it into a `my-project/` folder — no need to create
anything on GitHub first.

If you still want to pull boilerplate improvements later, add it as a second
remote:

```bash
git remote add boilerplate https://github.com/AxelVincent/turbo-express-start-boilerplate.git
```

**Railway is a separate decision.** The README's **Deploy on Railway** button
provisions the full stack in one click, but since March 2024 the deployed
services attach to the _template's_ repository — it does not create a repo of
your own. Create your repo with the template flow above, run this file in it,
then either point a fresh Railway project at the new repo (the committed
`railway.json` files configure both services) or deploy the Railway template
for its datastores and repoint `api` and `front` at your repo. `DEPLOY.md`
covers both routes.

Work top to bottom. Every step ends in something you can check — do not move on
from a step whose verification failed.

---

## Inputs

Ask for these first if they were not supplied:

| Input           | Example                | Used for                                        |
| --------------- | ---------------------- | ----------------------------------------------- |
| `PROJECT_NAME`  | `Northwind`            | Display name in the UI                          |
| `PROJECT_SLUG`  | `northwind`            | Database, metric prefix, service and job names  |
| `PORT_OFFSET`   | `10`                   | Added to every default port to avoid collisions |
| `DEPLOY_REGION` | `europe-west4-drams3a` | Railway region for `api` and `front`            |

`PROJECT_SLUG` must be lowercase, alphanumeric with hyphens — it becomes a
Postgres database name and a Prometheus metric prefix.

`DEPLOY_REGION` only matters if you deploy to Railway; it is one of `us-west2`,
`us-east4-eqdc4a`, `europe-west4-drams3a` or `asia-southeast1-eqsg3a`. Every
service should share it — see the Regions section of `DEPLOY.md`.

## Step 1 — Pick a port offset and prove it is free

Default ports, and what each becomes with the offset applied:

| Service           | Variable               | Default | New           |
| ----------------- | ---------------------- | ------- | ------------- |
| Frontend          | `FRONT_PORT`           | 3005    | 3005 + offset |
| API               | `API_PORT` / `PORT`    | 3030    | 3030 + offset |
| Postgres (host)   | `PGPORT`               | 5434    | 5434 + offset |
| Redis             | `REDIS_PORT`           | 6379    | 6379 + offset |
| Loki              | `LOKI_PORT`            | 3102    | 3102 + offset |
| Prometheus        | `PROMETHEUS_PORT`      | 9092    | 9092 + offset |
| Grafana           | `GRAFANA_PORT`         | 3202    | 3202 + offset |
| Tempo             | `TEMPO_PORT`           | 3200    | 3200 + offset |
| Tempo OTLP (HTTP) | `TEMPO_OTLP_HTTP_PORT` | 4318    | 4318 + offset |
| Tempo OTLP (gRPC) | `TEMPO_OTLP_GRPC_PORT` | 4317    | 4317 + offset |

Use a multiple of 10 (10, 20, 30…) so the numbers stay readable. Applying one
uniform offset keeps them distinct from each other.

Check every resulting port is free before writing anything:

```bash
OFFSET=10
for BASE in 3005 3030 5434 6379 3102 9092 3202 3200 4318 4317; do
  P=$((BASE + OFFSET))
  if lsof -nP -iTCP:$P -sTCP:LISTEN >/dev/null 2>&1; then
    echo "IN USE: $P (from base $BASE)"
  fi
done
echo "check complete"
```

**Verify:** the loop prints no `IN USE` lines. If it does, pick another offset
and run it again.

## Step 2 — Create the env files

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/front/.env.example apps/front/.env
```

Then apply the offset and the project name. Ports appear in more than one file
and must agree — the root `.env` is the host side of each Docker port mapping,
and `apps/api/.env` is what the API connects to.

In `.env`:

- `PGPORT`, `REDIS_PORT`, `LOKI_PORT`, `PROMETHEUS_PORT`, `GRAFANA_PORT`,
  `TEMPO_PORT`, `TEMPO_OTLP_HTTP_PORT`, `TEMPO_OTLP_GRPC_PORT`, `FRONT_PORT`,
  `API_PORT` → offset values from step 1
- `PGDATABASE` → `PROJECT_SLUG`

In `apps/api/.env`:

- `PORT` → offset API port
- `PGPORT` → offset Postgres port, `PGDATABASE` → `PROJECT_SLUG`
- `REDIS_PORT` → offset Redis port
- `LOKI_HOST` → `http://localhost:<offset Loki port>`
- `OTEL_EXPORTER_OTLP_ENDPOINT` → `http://localhost:<offset Tempo OTLP HTTP port>`
- `OTEL_SERVICE_NAME` → `<PROJECT_SLUG>-api`
- `BASE_URL` → `http://localhost:<offset API port>`
- `FRONTEND_BASE_URL` → `http://localhost:<offset front port>`
- `BETTER_AUTH_SECRET` → a fresh secret, at least 32 characters:
  `openssl rand -base64 32`
- `INTERNAL_RPC_SECRET` → another fresh secret

In `apps/front/.env`:

- `PORT` → offset front port
- `VITE_API_URL` → `http://localhost:<offset API port>`

**Verify:** `grep -c "3030\|5434\|6379" apps/api/.env` returns 0 unless the
offset is 0.

## Step 3 — Rename the project

| What            | File                                                              | Replace                                          |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| Project slug    | `apps/api/src/config/service.ts`                                  | `APP_SLUG` → `PROJECT_SLUG`                      |
| Display name    | `apps/front/src/lib/constants.ts`                                 | `Acme` → `PROJECT_NAME`                          |
| Logger fallback | `packages/logger/src/index.ts`                                    | `boilerplate` → `PROJECT_SLUG`                   |
| Prometheus      | `prometheus.yml`                                                  | job/monitor names, and the scrape target port    |
| Grafana folder  | `packages/metrics/grafana/provisioning/dashboards/dashboards.yml` | `Boilerplate` → `PROJECT_NAME`                   |
| Workspace name  | `package.json`                                                    | `@repo/monorepo` → `@<slug>/monorepo` (optional) |
| Railway region  | `apps/api/railway.json`, `apps/front/railway.json`                | `europe-west4-drams3a` → `DEPLOY_REGION`         |

`APP_SLUG` covers the whole API on its own — every metric name, the `app` label
and the default trace/log service name derive from it, so there is no need to
hunt through `metrics/`.

`prometheus.yml` needs the port too — its target is
`host.docker.internal:3030` and must become the offset API port, or Prometheus
scrapes the wrong service.

Leave the `@repo/*` package scope alone. It is deliberately generic and
renaming it touches every import for no benefit.

**Verify:** `grep -rn "boilerplate\|Acme" --exclude-dir=node_modules --exclude-dir=.git --exclude=pnpm-lock.yaml --exclude=SETUP.md .`
returns only prose in `README.md` and `CLAUDE.md`.

## Step 4 — Bring up infrastructure

```bash
pnpm install
docker network create app_network   # ignore "already exists"
docker compose up -d
```

**Verify:** `docker compose ps` shows six services running, and Tempo is not
restarting:

```bash
docker compose ps --format '{{.Service}} {{.State}}'
docker compose logs tempo | tail -5   # must not say "failed parsing config"
```

## Step 5 — Create the schema

```bash
pnpm db:migrate
pnpm db:types
```

**Verify:** `pnpm typecheck` passes — it will not if `db/types.ts` was not
regenerated against the new database.

## Step 6 — Run it

```bash
pnpm dev
```

**Verify**, substituting your offset ports:

```bash
curl -s localhost:<API_PORT>/health                      # {"status":"ok"}
curl -s -u metrics:secure_password localhost:<API_PORT>/metrics | head -3
```

The metrics lines must carry your new prefix, not `boilerplate_`.

Open Grafana on the offset port (`admin`/`admin`) and confirm Prometheus, Loki
and Tempo all appear under Connections → Data sources.

## Step 7 — Make it yours

The boilerplate ships a landing page describing itself. Replace it:

- `apps/front/src/routes/index.tsx` — hero copy
- `apps/front/src/components/features/landing/` — the tech-stack and feature
  sections, which describe this boilerplate rather than your product
- `README.md` — rewrite for your project; keep the env and port tables
- Delete `SETUP.md`; it has done its job

## Step 8 — Final check

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm format:check
```

All four must pass before the first commit.

---

## Notes

- Every port is driven by env files, so nothing above requires editing
  `docker-compose.yml`.
- The API needs `apps/api/.env`; it does not read the root `.env`. Both exist
  on purpose — the root one is consumed by Docker Compose.
- `docker compose down -v` deletes the database volume. Use plain
  `docker compose down` to keep your data.
