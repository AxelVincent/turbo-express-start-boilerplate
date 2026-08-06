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

### Ports

Railway routes the public domain to a **target port** you set per service
(Settings → Networking → Public Networking). It must match the port the process
actually listens on, or the domain 502s against a healthy container.

The simplest arrangement, and the one the Lead Club project uses, is to pin both
ends: set the target port to the app's port and let the app bind it.

| Service | Target port | Bound by                                   |
| ------- | ----------- | ------------------------------------------ |
| `api`   | 3030        | `process.env.PORT \|\| 3030` in `index.ts` |
| `front` | 3000        | Nitro, via `PORT`                          |

If you prefer to let Railway choose, leave `PORT` unset **and** update the
target port to match what it assigns — changing one without the other is the
failure mode.

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

By default Railway will deploy a commit whose tests fail, because it never runs
them. It has a native fix: Settings → Source → **Wait for CI**, which holds the
deploy until the repo's GitHub Actions finish successfully. With
`.github/workflows/ci.yml` present, ticking that box gets you a gated deploy
with no tokens, no secrets and no deploy job — which is why it is worth
preferring over Option B unless you need the extra control.

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

## Regions

| Region                     | Identifier               |
| -------------------------- | ------------------------ |
| US West (California)       | `us-west2`               |
| US East (Virginia)         | `us-east4-eqdc4a`        |
| EU West (Amsterdam)        | `europe-west4-drams3a`   |
| Southeast Asia (Singapore) | `asia-southeast1-eqsg3a` |

**Keep every service in one region.** The API talks to Postgres, Redis and Tempo
constantly over private networking. Splitting the stack puts that chatter on the
public wire and adds latency to every request and every span export. Region is a
per-service setting, so nothing stops you from mixing them — but there is no
reason to.

There are only two levers, and they cover different services.

### The account preferred region covers everything

Railway has no per-service region control in the template composer, and region
is a service setting rather than an environment variable, so **a template cannot
prompt for it**. Every service without an explicit region falls back to the
deploying user's preferred region.

So the one-knob answer is: set Account → Settings → **Preferred region** before
deploying the template. All ten services land together, and nothing in this repo
needs to change. This is the recommended route.

### `railway.json` pins `api` and `front`

The two services built from this repo can pin a region explicitly:

```json
"deploy": {
  "multiRegionConfig": {
    "europe-west4-drams3a": { "numReplicas": 1 }
  }
}
```

Config as code wins over the dashboard, so once this is set the Settings → Scale
→ Regions field is managed by the repo and editing these files is how you move
them. To vary by environment:

```json
"environments": {
  "staging": {
    "deploy": {
      "multiRegionConfig": { "us-east4-eqdc4a": { "numReplicas": 1 } }
    }
  }
}
```

**If you pin here, match your preferred region to it**, or set the other eight
services by hand — otherwise `api` and `front` sit in one region while Postgres,
Redis, the bucket, Caddy and the Grafana stack sit in another. Those eight have
no `railway.json` because they are not built from this repo; post-deploy they
are changed per service under Settings → **Scale** → Regions & Replicas.

Two constraints worth knowing before the first deploy:

- **Volumes pin the region and forbid replicas.** Postgres, Grafana, Loki,
  Prometheus and Tempo are volume-backed. Railway states plainly that "Replicas
  are not available for attached volumes", and a volume cannot move between
  regions — so for those five the region is effectively permanent once
  provisioned. Pick it before deploying, not after.
- **Replicas are per region, not a total.** `numReplicas: 1` under two region
  keys is two instances, not one spread across both.

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

Deploying that template provisions api, front, Postgres and Redis wired together
in one click.

### It does not give you your own repo — read this before using it

Since March 2024, deploying a Railway template **attaches the services directly
to the template's repository**. It does not copy or fork anything into your
account. Left alone, every project you spin up would be deploying this
boilerplate, and any product code would have to be committed here.

To get your own copy you must **eject**, per service:

Service → Settings → Source → **Upstream Repo** → `Eject` → pick the GitHub
org → `Eject service`.

That mirrors the repo into your account and repoints the service at the mirror.
Railway keeps watching upstream afterwards and opens a PR branch when the
boilerplate changes, which is a genuinely useful way to pull improvements into
a shipped product.

One caveat specific to this repo: ejecting is a _per-service_ action, and here
two services (`api` and `front`) share one monorepo. Whether ejecting the second
one reuses the first mirror or creates a second copy is not documented — verify
on the first run before relying on it.

## Recommended: start from a GitHub template repository instead

For "keep the boilerplate clean, start each project from a copy", the repo-first
route is simpler and avoids the eject ambiguity entirely.

Mark this repository as a **template repository** (Settings → check _Template
repository_, or `gh repo edit --template`). Then each new project is:

1. **Use this template** → new repo, in your account, private if you want.
2. Run `SETUP.md` in it — rename, offset ports, verify.
3. Create a Railway project pointed at the _new_ repo; the committed
   `railway.json` files configure both services.

A template repository beats a fork for this:

|                    | Fork                              | Template repository      |
| ------------------ | --------------------------------- | ------------------------ |
| History            | inherits every boilerplate commit | one clean initial commit |
| Link to source     | permanent "forked from" banner    | none                     |
| Visibility         | fork of a public repo is public   | private allowed          |
| Pull requests      | default to targeting upstream     | target your own repo     |
| Contribution graph | commits don't count               | commits count            |

The one thing a fork gives you that a template repo doesn't is an easy upstream
merge to pull boilerplate improvements later. If that matters more than a clean
history, add this repo as a second remote in the new project instead —
`git remote add boilerplate <url>` — which gets you the same ability without
the fork relationship.

The two approaches also compose: use the GitHub template for the code and keep
the Railway template purely for provisioning Postgres, Redis and the service
skeleton.

### The "clone the infra, repoint the code" workflow

This is the fastest route once a reference project exists, and it avoids
ejecting entirely.

1. Generate a template from a working project.
2. Deploy it for the new product — you get every datastore, volume and
   observability service already wired.
3. On `api` and `front` only: Settings → Source → **Disconnect**, then connect
   the new product's repository.
4. Set the config file path on each (`apps/api/railway.json`,
   `apps/front/railway.json`) so build and deploy settings come from the new
   repo rather than being re-entered by hand.
5. Replace the app-level variables; leave the datastore reference variables
   alone, since they already point at the new project's own Postgres and Redis.

Step 3 is genuinely two changes. What it does **not** carry across is
variables: a template generated from a product project brings that product's
variable names with it, so prune them back to what
`apps/api/.env.example` lists before publishing, or every new project starts
with a pile of irrelevant keys to clear out.

The bigger win is step 2. Postgres, Redis, object storage and the
Grafana/Loki/Prometheus/Tempo group — with their volumes and datasource
wiring — are the parts that take real time to rebuild by hand and are entirely
product-agnostic. Templating those is worth it even if you connect the two app
services manually every time.

Two things to fix in the template before publishing, so new projects do not
inherit them:

- Give each service a stable **private domain**. Railway assigns random names
  (`scintillating-optimism.railway.internal`), which anything scraping or
  calling the API internally — Prometheus, a worker — then has to be told about.
- Set **watch paths** on both app services. Without them every push rebuilds
  everything; `apps/*/railway.json` sets them once you enable config-as-code.
