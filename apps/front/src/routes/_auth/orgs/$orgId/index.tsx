import { createFileRoute, Link } from "@tanstack/react-router"
import { Settings } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_auth/orgs/$orgId/")({
  component: OrgDashboardPage,
})

function OrgDashboardPage() {
  const { orgId } = Route.useParams()
  const { data: orgData } = authClient.useActiveOrganization()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            {orgData?.name ?? "Organization"}
          </h1>
          <p className="text-muted-foreground">Manage your organization.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/orgs/$orgId/settings" params={{ orgId }}>
            <Settings className="h-4 w-4 mr-2" />
            Org Settings
          </Link>
        </Button>
      </div>
    </div>
  )
}
