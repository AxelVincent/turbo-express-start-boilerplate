# Turbo Express Start

A production-ready, full-stack monorepo boilerplate for building modern web applications. Features React 19, Express, PostgreSQL, Clerk authentication, and a complete observability stack.

## Features

- **Turborepo Monorepo** - Organized workspace with shared packages
- **React 19 + TanStack** - File-based routing and server state management
- **Express API** - Type-safe REST API with Zod validation
- **PostgreSQL + Kysely** - Type-safe SQL with auto-generated types
- **Clerk Authentication** - Complete auth with protected routes and webhooks
- **Full Observability** - Prometheus, Grafana, Loki, structured logging
- **Docker Infrastructure** - PostgreSQL, Redis, Qdrant, monitoring stack
- **Shadcn/ui + Tailwind** - Beautiful UI with dark/light theme support

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm 9.7.1+
- Docker and Docker Compose

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Configure Clerk (see Authentication section)
# Add your Clerk keys to .env

# Start infrastructure services
docker network create app_network
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| API | http://localhost:3001 | - |
| Grafana | http://localhost:3201 | admin/admin |
| Prometheus | http://localhost:9091 | - |

## Project Structure

```
turbo-express-start-boilerplate/
├── apps/
│   ├── api/                     # Express backend (port 3001)
│   │   └── src/
│   │       ├── config/          # Environment & Clerk configuration
│   │       ├── db/              # Database setup, migrations, types
│   │       ├── middlewares/     # Auth, metrics, validation middleware
│   │       ├── routes_web/      # API routes with contracts
│   │       ├── services/        # Business logic (user sync)
│   │       ├── webhook/         # Clerk webhook handlers
│   │       └── __tests__/       # Jest tests
│   │
│   └── front/                   # React frontend (port 3000)
│       └── src/
│           ├── components/      # UI components, layout, sidebar
│           │   ├── features/    # Feature-specific components
│           │   ├── layout/      # Layout components (sidebar)
│           │   └── ui/          # Shadcn/ui primitives
│           ├── routes/          # TanStack Router pages
│           │   ├── _auth/       # Protected routes
│           │   ├── login.tsx    # Clerk sign-in
│           │   └── signup.tsx   # Clerk sign-up
│           ├── lib/             # API client, hooks, utils
│           └── hooks/           # Custom React hooks
│
├── packages/
│   ├── logger/                  # Pino logging with Loki integration
│   ├── metrics/                 # Prometheus metrics framework
│   ├── eslint-config/           # Shared ESLint configuration
│   ├── typescript-config/       # Shared TypeScript configurations
│   └── jest-presets/            # Jest test presets
│
├── docker-compose.yml           # Infrastructure services
├── prometheus.yml               # Prometheus scrape configuration
└── turbo.json                   # Turborepo configuration
```

## Authentication

This boilerplate uses [Clerk](https://clerk.com) for authentication.

### Getting Your Clerk Keys

1. Go to [clerk.com](https://clerk.com) and sign up for a free account
2. Create a new application (or use an existing one)
3. In the Clerk Dashboard, navigate to **API Keys** in the left sidebar
4. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
5. For webhooks, go to **Webhooks** → **Add Endpoint**:
   - URL: `https://your-domain.com/webhook/clerk` (use ngrok for local dev)
   - Events: Select `user.created`, `user.updated`, `user.deleted`
   - Copy the **Signing Secret** (starts with `whsec_`)

### Setup

1. Create a Clerk application at https://dashboard.clerk.com
2. Add your keys to `.env`:

```env
# Frontend
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

3. Configure Clerk webhooks:
   - Go to Clerk Dashboard → Webhooks
   - Add endpoint: `https://your-domain.com/webhook/clerk`
   - Select events: `user.created`, `user.updated`, `user.deleted`

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│    Clerk    │────▶│   Backend   │
│  (React)    │     │   (Auth)    │     │  (Express)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │  1. Sign in       │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │  2. JWT Token     │                   │
       │◀──────────────────│                   │
       │                   │                   │
       │  3. API Request (Bearer token)        │
       │──────────────────────────────────────▶│
       │                   │                   │
       │                   │  4. Verify JWT    │
       │                   │◀──────────────────│
       │                   │                   │
       │  5. Response                          │
       │◀──────────────────────────────────────│
```

### Protected Routes

Frontend routes under `/_auth/` require authentication:

```typescript
// routes/_auth.tsx - Layout for protected routes
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context }) => {
    if (!context.auth?.userId) {
      throw redirect({ to: '/login' })
    }
  },
})
```

Backend routes under `/web/` require authentication:

```typescript
// middlewares/require_auth.ts
router.use('/web', requireAuth, webRoutes)
```

### User Synchronization

Clerk webhooks automatically sync users to PostgreSQL:

- `user.created` → Creates user in database
- `user.updated` → Updates user in database
- `user.deleted` → Removes user from database

## API Development

### Route Organization

Routes follow a contract-based pattern:

```
routes_web/users/
├── add_user/
│   ├── contract.ts      # Zod schemas & TypeScript types
│   └── add_user.ts      # Route handler
├── get_users/
│   ├── contract.ts
│   └── get_users.ts
└── index.ts             # Route registration
```

### Contract Example

```typescript
// contract.ts
import { z } from 'zod'

export const AddUserBodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

export type AddUserBody = z.infer<typeof AddUserBodySchema>

export const AddUserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  name: z.string(),
})

export type AddUserResponse = z.infer<typeof AddUserResponseSchema>
```

### Frontend Type Safety

Contracts are exported to the frontend:

```typescript
// Frontend usage
import type { AddUserBody } from '@repo/api/routes_web/users/add_user/contract'

const createUser = async (data: AddUserBody) => {
  const response = await apiClient.post('/web/users', data)
  return response.data
}
```

## Database

### Migrations

```bash
# Create a new migration
cd apps/api
pnpm db:migrate:create add_new_table

# Run all pending migrations
pnpm db:migrate

# Rollback last migration
pnpm db:migrate:down

# Generate TypeScript types from schema
pnpm db:types
```

### Schema

Current schema includes:

```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Kysely Usage

```typescript
import { getDatabase } from '../db'

const db = getDatabase()

// Type-safe queries
const users = await db
  .selectFrom('users')
  .selectAll()
  .where('email', 'like', '%@example.com')
  .execute()
```

## Observability

### Metrics

Application metrics are exposed at `/metrics` (Prometheus format).

**HTTP Metrics (automatic):**
- `http_requests_total` - Request count by method/route/status
- `http_request_duration_seconds` - Request latency histogram
- `http_request_size_bytes` - Request payload size
- `http_response_size_bytes` - Response payload size

**Custom Metrics:**
- `active_users` - Gauge of concurrent users
- `user_operations_total` - Counter of CRUD operations
- `database_queries_total` - Database query count
- `database_query_duration_seconds` - Query latency

### Logging

Structured JSON logging with Pino:

```typescript
import { logger } from '@repo/logger'

logger.info({ userId, action: 'login' }, 'User logged in')
logger.error({ err, requestId }, 'Request failed')
```

Logs are aggregated in Loki and queryable via Grafana.

### Grafana Dashboards

Pre-configured dashboards available at http://localhost:3201:

- Application Overview
- HTTP Request Metrics
- Database Performance
- Node.js Runtime Metrics

## Infrastructure Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Primary database |
| Redis Stack | 6379 | Caching, sessions, JSON support |
| Qdrant | 6333-6335 | Vector database for embeddings |
| Prometheus | 9091 | Metrics collection |
| Grafana | 3201 | Dashboards and visualization |
| Loki | 3101 | Log aggregation |

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service]

# Stop all services
docker-compose down

# Reset all data
docker-compose down -v
```

## Development Scripts

### Root Level

```bash
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all apps and packages
pnpm test             # Run all tests
pnpm lint             # Lint all code
pnpm format           # Format with Prettier
pnpm clean            # Clean build artifacts
pnpm db:migrate       # Run database migrations
```

### Frontend (`apps/front`)

```bash
pnpm dev              # Vite dev server (port 3000)
pnpm build            # Production build
pnpm test             # Run Vitest tests
pnpm ui:add           # Add shadcn/ui components
```

### Backend (`apps/api`)

```bash
pnpm dev              # Nodemon dev server (port 3001)
pnpm build            # TypeScript compilation
pnpm test             # Run Jest tests
pnpm db:migrate       # Run migrations
pnpm db:types         # Generate database types
pnpm webhook:listen   # Local Clerk webhook testing
```

## Environment Variables

```env
# Database
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=boilerplate

# Redis
REDISUSER=default
REDISPASSWORD=redis_password

# Qdrant
QDRANT_API_KEY=your_api_key
QDRANT_PORT=6333

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# API
API_PORT=3001
NODE_ENV=development
```

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| TanStack Router | 1.132.0 | File-based routing |
| TanStack Query | 5.90.11 | Server state management |
| Vite | 7.1.7 | Build tool |
| Tailwind CSS | 4.1.17 | Styling |
| Shadcn/ui | Latest | UI components |
| Clerk React | 5.57.1 | Authentication |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express | 4.18.3 | Web framework |
| Kysely | 0.28.8 | SQL query builder |
| Zod | 3.23.8 | Validation |
| Pino | 10.1.0 | Logging |
| Clerk Express | 1.7.54 | Authentication |
| PostgreSQL | 15 | Database |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Turborepo | Monorepo orchestration |
| Docker Compose | Service orchestration |
| Prometheus | Metrics collection |
| Grafana | Visualization |
| Loki | Log aggregation |
| Redis Stack | Caching |
| Qdrant | Vector database |

## Customization

1. **Update package names** in all `package.json` files
2. **Configure Clerk** with your application keys
3. **Add database migrations** in `apps/api/src/db/migrations`
4. **Create API routes** in `apps/api/src/routes_web`
5. **Build frontend pages** in `apps/front/src/routes`
6. **Customize Grafana dashboards** in `packages/metrics/grafana`

## License

MIT
