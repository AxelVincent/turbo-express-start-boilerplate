import { createFileRoute, Link } from "@tanstack/react-router"
import { useAuth } from "@/lib/auth-provider"
import { APP_NAME } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Server,
  Database,
  Shield,
  BarChart3,
  Layers,
  Building,
  GitBranch,
  Palette,
  FlaskConical,
  ShieldCheck,
  Users,
  Settings,
  Mail,
  ArrowRight,
  Check,
  Terminal,
} from "lucide-react"

export const Route = createFileRoute("/")({ component: App })

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              {APP_NAME[0]}
            </div>
            <span className="font-semibold tracking-tight">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button size="sm" asChild>
                <Link to="/orgs">
                  Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/signin">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
            Full-Stack Boilerplate
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
            Turbo Express Start
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A production-ready full-stack monorepo with auth, organizations,
            admin panel, transactional emails, integration tests, and
            observability.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            {isAuthenticated ? (
              <>
                <Button size="lg" asChild>
                  <Link to="/orgs">
                    <Building className="w-4 h-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/admin">
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/signup">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/signin">Log in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-20 px-6 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Tech Stack
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything configured and ready for production.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Layers,
                title: "Turborepo",
                desc: "Monorepo with shared packages, ESLint plugin, TypeScript configs, and Jest presets.",
              },
              {
                icon: Zap,
                title: "React 19 + TanStack",
                desc: "File-based routing, SSR, query prefetching with queryOptions pattern.",
              },
              {
                icon: Server,
                title: "Express + Zod",
                desc: "Type-safe API with contracts shared between frontend and backend.",
              },
              {
                icon: Database,
                title: "PostgreSQL + Kysely",
                desc: "Type-safe SQL, automatic migrations, auto-generated types.",
              },
              {
                icon: Shield,
                title: "Better Auth",
                desc: "Email/password, organizations, roles, invitations, cookie sessions.",
              },
              {
                icon: Mail,
                title: "Resend Emails",
                desc: "Password reset, email verification, org invitations with HTML templates.",
              },
              {
                icon: FlaskConical,
                title: "Integration Tests",
                desc: "BDD framework with user pooling, domain users, and auto-cleanup.",
              },
              {
                icon: Palette,
                title: "Shadcn/ui + Tailwind 4",
                desc: "Full component library, collapsible sidebar, dark/light theme.",
              },
            ].map((item, i) => (
              <div key={i} className="space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                  <item.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Built-in Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Ready to use out of the box.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Building,
                title: "Multi-Organization",
                items: [
                  "Create and switch orgs",
                  "Member roles (owner, admin, member)",
                  "Email invitations with Resend",
                  "Org settings with inline editing",
                ],
              },
              {
                icon: ShieldCheck,
                title: "Admin Backoffice",
                items: [
                  "Dual sidebar (user + admin)",
                  "Role-based route protection",
                  "User management with role editing",
                  "Separate admin layout",
                ],
              },
              {
                icon: Users,
                title: "User Management",
                items: [
                  "Full CRUD operations",
                  "Role assignment (user, admin, super_admin)",
                  "Search and pagination",
                  "Integration tested",
                ],
              },
              {
                icon: Settings,
                title: "Account & Auth",
                items: [
                  "Profile editing",
                  "Password change",
                  "Forgot / reset password flow",
                  "Email verification on signup",
                ],
              },
              {
                icon: GitBranch,
                title: "Developer Experience",
                items: [
                  "15 custom ESLint rules",
                  "Type-safe API contracts",
                  "Query key factories",
                  "Route loader prefetching",
                ],
              },
              {
                icon: BarChart3,
                title: "Observability",
                items: [
                  "Prometheus metrics",
                  "Grafana dashboards",
                  "Loki log aggregation",
                  "Structured Pino logging",
                ],
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border bg-background p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                    <feature.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                </div>
                <ul className="space-y-2">
                  {feature.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="w-3.5 h-3.5 text-foreground shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 px-6 border-t">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Up and running in 2 minutes
            </h2>
          </div>
          <div className="rounded-xl border bg-zinc-950 p-6 overflow-x-auto">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-mono">terminal</span>
            </div>
            <pre className="text-sm text-zinc-300 font-mono leading-relaxed">
              {`pnpm install
cp .env.example .env
docker-compose up -d
pnpm db:migrate
pnpm dev`}
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Ready to go
          </h2>
          <p className="text-muted-foreground text-lg">
            Clone, configure, and start building.
          </p>
          <div className="flex gap-3 justify-center">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link to="/orgs">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-[10px] font-bold">
              {APP_NAME[0]}
            </div>
            <span className="text-sm text-muted-foreground">{APP_NAME}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Turborepo + React 19 + Express + PostgreSQL + Better Auth
          </p>
        </div>
      </footer>
    </div>
  )
}
