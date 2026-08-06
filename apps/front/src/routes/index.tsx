import { createFileRoute, Link } from "@tanstack/react-router"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Building, ShieldCheck, Terminal } from "lucide-react"
import { LandingNav } from "@/components/features/landing/landing-nav"
import { LandingTechStack } from "@/components/features/landing/landing-tech-stack"
import { LandingFeatures } from "@/components/features/landing/landing-features"
import { LandingFooter } from "@/components/features/landing/landing-footer"

export const Route = createFileRoute("/")({ component: App })

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <LandingNav isAuthenticated={isAuthenticated} />

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

      <LandingTechStack />
      <LandingFeatures />

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

      <LandingFooter />
    </div>
  )
}
