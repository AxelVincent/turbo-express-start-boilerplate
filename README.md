# Turbo Express Start

A production-ready, full-stack monorepo boilerplate for building modern web applications. Features React 19, Express, PostgreSQL, Better Auth with multi-org support, and a complete observability stack.

## Features

- **Turborepo Monorepo** - Organized workspace with shared packages
- **React 19 + TanStack** - File-based routing, SSR, and server state management
- **Express API** - Type-safe REST API with Zod validation and contract-based routes
- **PostgreSQL + Kysely** - Type-safe SQL with auto-generated types and migrations
- **Better Auth** - Email/password auth with organization support, roles, and invitations
- **Resend Emails** - Transactional emails for password reset, verification, and org invitations
- **Admin Backoffice** - Dual sidebar system with role-based admin panel
- **Organization Management** - Multi-org with member management, invitations, and settings
- **Integration Test System** - BDD-style test framework with user pooling and auto-cleanup
- **Custom ESLint Plugin** - 15 rules enforcing code organization and test quality
- **Full Observability** - Prometheus, Grafana, Loki, structured logging
- **Docker Infrastructure** - PostgreSQL, Redis, monitoring stack
- **Shadcn/ui + Tailwind 4** - Beautiful UI with dark/light theme support

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

# Start infrastructure services
docker network create app_network
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Access Points

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| API      | http://localhost:3035 |
| Grafana  | http://localhost:3202 |

## Project Structure

```
turbo-express-start-boilerplate/
├── apps/
│   ├── api/                     # Express backend
│   │   ├── src/
│   │   │   ├── auth/            # Better Auth config, user roles
│   │   │   ├── db/              # Database setup, migrations, types
│   │   │   ├── middlewares/     # Auth, metrics, validation, test middleware
│   │   │   ├── routes_web/      # API routes with contracts
│   │   │   │   └── users/       # User CRUD with integration tests
│   │   │   │       └── __tests__/  # BDD integration test cases
│   │   │   ├── routes_tests/    # Test route infrastructure (/apitests)
│   │   │   └── services/        # Business logic
│   │   └── tests/               # Test infrastructure
│   │       ├── user/            # Test user management (pool, domains)
│   │       └── utils/           # Assertions, helpers, test suite factory
│   │
│   └── front/                   # React frontend
│       └── src/
│           ├── components/
│           │   ├── features/    # Feature components (users)
│           │   ├── layout/      # Sidebar, admin sidebar, OrgSwitcher, UserMenu
│           │   └── ui/          # Shadcn/ui primitives
│           ├── routes/
│           │   ├── _auth/       # Protected routes (orgs, settings)
│           │   │   └── orgs/    # Org dashboard, settings, member management
│           │   ├── _admin/      # Admin routes (backoffice, users)
│           │   ├── signin.tsx
│           │   ├── signup.tsx
│           │   ├── forgot-password.tsx
│           │   └── reset-password.tsx
│           └── lib/             # API client, hooks, query engine
│
├── packages/
│   ├── eslint-plugin/           # 15 custom ESLint rules
│   ├── eslint-config/           # Shared ESLint configuration
│   ├── typescript-config/       # Shared TypeScript configurations
│   ├── logger/                  # Pino logging with Loki integration
│   ├── metrics/                 # Prometheus metrics framework
│   └── jest-presets/            # Jest test presets
│
├── docker-compose.yml
└── turbo.json
```

## Authentication

This boilerplate uses [Better Auth](https://www.better-auth.com) with the organization plugin.

### Features

- Email/password sign-up and sign-in
- Password reset flow (forgot + reset)
- Cookie-based sessions
- Organization support with member roles (owner, admin, member)
- Invitation system with email
- Role-based access control (user, admin, super_admin)

### Auth Flow

```
User signs in → Better Auth session cookie → API validates cookie → req.auth populated
```

### Protected Routes

Frontend routes under `/_auth/` require authentication, `/_admin/` requires admin role:

```typescript
// _auth.tsx - Protected layout
beforeLoad: ({ context }) => {
  if (context.auth?.isAuthenticated === false) {
    throw redirect({ to: "/signin" })
  }
}

// _admin.tsx - Admin layout (admin/super_admin only)
// Redirects non-admins to /
```

## Organization Management

- **Org list** - View and switch between organizations
- **Org dashboard** - Landing page with settings link
- **Org settings** - Edit name/slug, manage members, send invitations
- **Member management** - Change roles, remove members
- **Invitations** - Send, resend (with cooldown), cancel with confirmation
- **OrgSwitcher** - Header dropdown for quick org switching

## Admin Backoffice

Dual sidebar system with separate admin panel at `/admin`:

- **User sidebar** - Organizations, Backoffice link (admin only)
- **Admin sidebar** - Dashboard, Users management, Back to App
- **User role management** - Change user roles via dropdown (user/admin/super_admin)
- **Account settings** - Profile editing, password change

## Integration Tests

BDD-style integration test framework ported from production:

```typescript
createIntegrationTestSuite(
  { name: "users", routePrefix: "/users" },
  {
    when: "an authenticated user requests the users list",
    then: "they receive a paginated list of users",
    route: "/get_users_returns_list",
  },
)
```

### Running Tests

```bash
# Start the API server first
pnpm --filter @repo/api dev

# Run integration tests
pnpm --filter @repo/api test:integration
```

### Test Infrastructure

- **User pool** - Pre-seeded test users with automatic cleanup
- **Domain users** - Typed methods (user.me.getUsers(), user.orgs.createOrg())
- **Assertions** - Labeled assertions (isTruthy, isEqual, isIncluded, etc.)
- **Test routes** - Mounted at `/apitests` in dev/test environments
- **Given/When/Then** - Enforced by ESLint rules

## Custom ESLint Plugin

15 rules enforcing code quality:

**Code Organization:**

- `one-query-per-file` - One query export per file in queries/ folders
- `no-barrel-files` - No pure re-export index files

**Integration Test Quality:**

- `one-test-suite-per-file`, `max-test-cases-per-suite` (max 10)
- `require-given-when-then` - BDD comment structure
- `no-raw-http-in-test-cases` - Use domain methods
- `no-direct-db-in-test-cases` - No direct DB access
- And 8 more structural rules

## Query Engine

TanStack Query with production patterns:

- **SSR-safe `prefetch()`** - Skips server, swallows errors
- **`queryOptions()` pattern** - Reusable in hooks and route loaders
- **Smart retry** - No retry on 4xx, max 3 retries on 5xx
- **Route loader prefetching** - Instant page loads
- **Query key factories** - Hierarchical cache invalidation

## Development Scripts

```bash
# Root
pnpm dev              # Start all apps
pnpm build            # Build all
pnpm lint             # Lint all (tsc + eslint)
pnpm format           # Format with Prettier

# Frontend
pnpm --filter @repo/front dev
pnpm --filter @repo/front lint
pnpm --filter @repo/front build

# Backend
pnpm --filter @repo/api dev
pnpm --filter @repo/api lint
pnpm --filter @repo/api test
pnpm --filter @repo/api test:integration
pnpm --filter @repo/api db:migrate
pnpm --filter @repo/api db:types
```

## Tech Stack

| Layer    | Technology                                                   |
| -------- | ------------------------------------------------------------ |
| Frontend | React 19, TanStack Router/Query/Start, Tailwind 4, Shadcn/ui |
| Backend  | Express, Kysely, Zod, Better Auth, Pino                      |
| Database | PostgreSQL 15                                                |
| Auth     | Better Auth (email/password, organizations, roles)           |
| Testing  | Jest, custom integration test framework                      |
| Linting  | ESLint + 15 custom rules, TypeScript strict mode             |
| Infra    | Docker Compose, Prometheus, Grafana, Loki, Redis             |
| Monorepo | Turborepo, pnpm workspaces                                   |

## License

MIT
