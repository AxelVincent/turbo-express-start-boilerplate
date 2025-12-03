# Full-Stack Monorepo Boilerplate

A production-ready monorepo boilerplate for rapidly starting modern web applications. Built with Turborepo, this template includes a complete backend API, frontend application, and comprehensive infrastructure setup.

## Architecture Overview

This is a fully-featured monorepo that provides:
- Type-safe API with auto-generated contracts
- Modern React frontend with TanStack Router
- Database migrations and type generation
- Observability stack (metrics, logging, monitoring)
- Docker Compose infrastructure setup

## Quick Start

### Prerequisites
- Node.js >= 14.0.0
- pnpm 9.7.1
- Docker and Docker Compose

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start infrastructure services
docker network create app_network
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

The frontend will be available at http://localhost:3000 and the API at http://localhost:3001.

## Project Structure

### Apps

- **`apps/front`** - React frontend application
  - Built with Vite and TanStack Router
  - React 19 with TanStack Query for data fetching
  - Shadcn UI components with Tailwind CSS
  - Type-safe API client integration

- **`apps/api`** - Express backend API
  - RESTful API with Zod validation
  - Kysely for type-safe SQL queries
  - PostgreSQL database with migrations
  - Auto-generated TypeScript types from database schema
  - Structured route organization with contracts

### Packages

- **`@repo/logger`** - Pino-based structured logging
  - Loki integration for centralized logging
  - Configurable log levels

- **`@repo/metrics`** - Prometheus metrics collection
  - Custom metrics and instrumentation
  - Pre-configured Grafana dashboards

- **`@repo/eslint-config`** - Shared ESLint configuration
- **`@repo/typescript-config`** - Shared TypeScript configurations
- **`@repo/jest-presets`** - Jest test configurations

All packages and apps are 100% TypeScript.

## Infrastructure Services

The Docker Compose setup includes:

- **PostgreSQL 15** - Primary database (port 5432)
- **Redis Stack** - Caching and session storage with JSON support (port 6379)
- **Qdrant** - Vector database for embeddings (ports 6333-6335)
- **Prometheus** - Metrics collection and storage (port 9090)
- **Grafana** - Metrics visualization and dashboards (port 3200)
- **Loki** - Log aggregation (port 3100)

### Accessing Services

- Grafana: http://localhost:3200 (admin/admin)
- Prometheus: http://localhost:9090
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm build            # Build all apps and packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages

# Database
pnpm db:migrate       # Run database migrations
pnpm db:types         # Generate TypeScript types from database
```

### API Development

The API uses a structured route pattern with auto-generated contracts:

```
apps/api/src/routes_web/
  └── users/
      ├── add_user/
      │   ├── contract.ts    # Route contract (validation, types)
      │   └── add_user.ts    # Route handler
      ├── get_users/
      └── ...
```

Contract exports are automatically available to the frontend for type-safe API calls.

### Database Migrations

```bash
# Create a new migration
cd apps/api
pnpm db:migrate:create migration_name

# Run migrations
pnpm db:migrate

# Rollback last migration
pnpm db:migrate:down

# Generate types after schema changes
pnpm db:types
```

## Observability

### Metrics
- Application metrics exposed at `/metrics` endpoint
- Custom metrics using `@repo/metrics` package
- Prometheus scrapes metrics every 10 seconds
- Pre-configured Grafana dashboards

### Logging
- Structured JSON logging with Pino
- Logs aggregated in Loki
- Query logs in Grafana

### Monitoring
- Grafana dashboards for application metrics
- Database connection pooling metrics
- HTTP request/response metrics

## Environment Variables

Required environment variables (see [.env.example](.env.example)):

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
```

## Docker Support

The monorepo is configured for Docker deployment:

```bash
# Start all infrastructure services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

Note: The app services (front/api) are commented out in docker-compose.yml for local development. Uncomment them for production deployment.

## Tech Stack

### Frontend
- React 19
- TanStack Router (file-based routing)
- TanStack Query (data fetching)
- Vite (build tool)
- Tailwind CSS 4
- Shadcn UI components

### Backend
- Express.js
- Kysely (SQL query builder)
- Zod (validation)
- PostgreSQL
- Pino (logging)

### Infrastructure
- Turborepo (monorepo orchestration)
- Docker Compose
- Prometheus + Grafana (monitoring)
- Loki (logging)
- Redis Stack
- Qdrant

### Development
- TypeScript 5
- ESLint
- Prettier
- Jest/Vitest
- pnpm workspaces

## Features

- Type-safe API contracts shared between frontend and backend
- Auto-generated database types
- Hot module replacement in development
- Structured logging with query capabilities
- Metrics collection and visualization
- Database migration system
- Docker-based infrastructure
- Monorepo with shared packages
- Code formatting and linting
- Test setup for both frontend and backend

## Customization

This boilerplate is designed to be forked and customized:

1. Update package names in `package.json` files
2. Configure your database schema in `apps/api/src/db/migrations`
3. Add your API routes in `apps/api/src/routes_web`
4. Build your frontend in `apps/front/src/routes`
5. Customize Grafana dashboards in `packages/metrics/grafana`

## License

This boilerplate is provided as-is for rapid project initialization.
