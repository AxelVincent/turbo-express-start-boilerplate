import {
  Zap,
  Server,
  Database,
  Shield,
  Layers,
  Palette,
  FlaskConical,
  Mail,
} from "lucide-react"

const STACK = [
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
]

export function LandingTechStack() {
  return (
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
          {STACK.map((item) => (
            <div key={item.title} className="space-y-3">
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
  )
}
