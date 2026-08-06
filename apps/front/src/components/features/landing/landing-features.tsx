import {
  BarChart3,
  Building,
  Check,
  GitBranch,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react"

const FEATURES = [
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
      "27 custom ESLint rules",
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
      "Loki logs + Tempo traces",
      "Structured Pino logging",
    ],
  },
]

export function LandingFeatures() {
  return (
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
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-background p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                  <feature.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
              </div>
              <ul className="space-y-2">
                {feature.items.map((item) => (
                  <li
                    key={item}
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
  )
}
