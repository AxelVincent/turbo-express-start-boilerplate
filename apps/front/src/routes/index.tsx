import { createFileRoute, Link } from '@tanstack/react-router'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import {
  Zap,
  Server,
  Database,
  Shield,
  BarChart3,
  Layers,
  Users,
  Lock,
  Box,
  GitBranch,
  Terminal,
  Palette,
  Globe,
  FileCode,
  Monitor,
  Play,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const stack = [
    {
      icon: <Layers className="w-8 h-8 text-cyan-400" />,
      title: 'Turborepo Monorepo',
      description:
        'Organized workspace with shared packages for logger, metrics, ESLint, TypeScript configs, and Jest presets.',
    },
    {
      icon: <Zap className="w-8 h-8 text-cyan-400" />,
      title: 'React 19 + TanStack',
      description:
        'Modern React with TanStack Router for file-based routing and TanStack Query for server state management.',
    },
    {
      icon: <Server className="w-8 h-8 text-cyan-400" />,
      title: 'Express API',
      description:
        'Type-safe REST API with Zod validation and contract-based route organization shared with the frontend.',
    },
    {
      icon: <Database className="w-8 h-8 text-cyan-400" />,
      title: 'PostgreSQL + Kysely',
      description:
        'Type-safe SQL queries with Kysely, automatic migrations, and auto-generated TypeScript types.',
    },
    {
      icon: <Shield className="w-8 h-8 text-cyan-400" />,
      title: 'Clerk Authentication',
      description:
        'Complete auth system with sign-in, sign-up, protected routes, and webhook-based user sync.',
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-cyan-400" />,
      title: 'Full Observability',
      description:
        'Prometheus metrics, Grafana dashboards, Loki log aggregation, and structured Pino logging.',
    },
    {
      icon: <Box className="w-8 h-8 text-cyan-400" />,
      title: 'Docker Infrastructure',
      description:
        'PostgreSQL, Redis Stack, Qdrant vector DB, Prometheus, Grafana, and Loki ready to go.',
    },
    {
      icon: <Palette className="w-8 h-8 text-cyan-400" />,
      title: 'Shadcn/ui + Tailwind',
      description:
        'Beautiful UI components with Radix primitives, dark/light theme support, and Tailwind CSS 4.',
    },
  ]

  const features = [
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: 'Type-Safe Contracts',
      description: 'API contracts shared between frontend and backend with Zod schemas.',
    },
    {
      icon: <Terminal className="w-6 h-6" />,
      title: 'Database Migrations',
      description: 'Versioned migrations with Kysely and auto-generated types.',
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Protected Routes',
      description: 'Authentication-protected pages with automatic redirects.',
    },
  ]

  const demos = [
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'API Request',
      description: 'Fetch data from TanStack Start API routes',
      to: '/demo/start/api-request' as const,
      color: 'from-blue-600 to-blue-500',
      borderColor: 'border-blue-400',
      shadowColor: 'hover:shadow-blue-500/50',
    },
    {
      icon: <FileCode className="w-6 h-6" />,
      title: 'Server Functions',
      description: 'Todo app with server-side mutations',
      to: '/demo/start/server-funcs' as const,
      color: 'from-emerald-600 to-emerald-500',
      borderColor: 'border-emerald-400',
      shadowColor: 'hover:shadow-emerald-500/50',
    },
    {
      icon: <Monitor className="w-6 h-6" />,
      title: 'SSR Demos',
      description: 'SPA mode, Full SSR, and Data-only rendering',
      to: '/demo/start/ssr' as const,
      color: 'from-purple-600 to-purple-500',
      borderColor: 'border-purple-400',
      shadowColor: 'hover:shadow-purple-500/50',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h1 className="text-5xl md:text-6xl font-black text-white [letter-spacing:-0.04em]">
              <span className="text-gray-300">TURBO</span>{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                EXPRESS
              </span>{' '}
              <span className="text-gray-300">START</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            Production-Ready Full-Stack Monorepo Boilerplate
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            A comprehensive starter template with React 19, Express, PostgreSQL, Clerk authentication,
            and full observability stack. Everything you need to build modern web applications.
          </p>

          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4 flex-wrap justify-center">
              <SignedOut>
                <Link
                  to="/login"
                  className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors border border-slate-600"
                >
                  Create Account
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/users"
                  search={{ page: 1, pageSize: 10, search: '' }}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-purple-600/50 flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Users Demo
                </Link>
              </SignedIn>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors border border-slate-600"
              >
                View on GitHub
              </a>
            </div>
            <SignedIn>
              <p className="text-gray-400 text-sm mt-2">
                Check out the{' '}
                <Link
                  to="/users"
                  search={{ page: 1, pageSize: 10, search: '' }}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Users Demo
                </Link>{' '}
                to see the full-stack architecture in action
              </p>
            </SignedIn>
            <SignedOut>
              <p className="text-gray-400 text-sm mt-2">
                Sign in to access the protected Users Demo page
              </p>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Tech Stack Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Complete Tech Stack
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Everything configured and ready for production deployment
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stack.map((item, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-cyan-500/20 rounded-xl text-cyan-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demos Section */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Play className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white text-center">
            Interactive Demos
          </h2>
        </div>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Explore TanStack Start features with these live examples
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demos.map((demo, index) => (
            <Link
              key={index}
              to={demo.to}
              className={`group relative bg-gradient-to-r ${demo.color} rounded-xl p-6 border-2 ${demo.borderColor} shadow-lg transform transition-all hover:scale-105 ${demo.shadowColor}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg text-white">
                  {demo.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{demo.title}</h3>
              </div>
              <p className="text-white/80 text-sm">{demo.description}</p>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white/80 text-sm">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Architecture Overview
        </h2>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          <pre className="text-sm text-gray-300 overflow-x-auto">
{`turbo-express-start-boilerplate/
├── apps/
│   ├── api/                 # Express backend (port 3001)
│   │   ├── src/
│   │   │   ├── config/      # Environment & Clerk config
│   │   │   ├── db/          # Database, migrations, types
│   │   │   ├── middlewares/ # Auth, metrics, validation
│   │   │   ├── routes_web/  # API routes with contracts
│   │   │   ├── services/    # Business logic
│   │   │   └── webhook/     # Clerk webhook handlers
│   │   └── package.json
│   │
│   └── front/               # React frontend (port 3000)
│       └── src/
│           ├── components/  # UI components, layout, sidebar
│           ├── routes/      # TanStack Router pages
│           │   ├── _auth/   # Protected routes (users)
│           │   ├── login    # Clerk sign-in
│           │   └── signup   # Clerk sign-up
│           └── lib/         # API client, hooks, utils
│
├── packages/
│   ├── logger/              # Pino logging + Loki
│   ├── metrics/             # Prometheus metrics
│   ├── eslint-config/       # Shared ESLint
│   ├── typescript-config/   # Shared TS configs
│   └── jest-presets/        # Test configurations
│
└── docker-compose.yml       # PostgreSQL, Redis, Qdrant,
                             # Prometheus, Grafana, Loki`}
          </pre>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 px-6 bg-slate-800/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Quick Start
          </h2>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <pre className="text-sm text-gray-300 overflow-x-auto">
{`# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start infrastructure
docker network create app_network
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev

# Frontend: http://localhost:3000
# API: http://localhost:3001
# Grafana: http://localhost:3201`}
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-700">
        <div className="max-w-5xl mx-auto text-center text-gray-400 text-sm">
          <p>
            Built with Turborepo, React, Express, PostgreSQL, and Clerk
          </p>
        </div>
      </footer>
    </div>
  )
}
