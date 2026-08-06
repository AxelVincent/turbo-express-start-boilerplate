import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  useOrganizations,
  useSetActiveOrganization,
  getLastActiveOrgId,
  organizationsListOptions,
} from "@/lib/hooks/use-organizations"
import { prefetch } from "@/lib/query-client"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateOrgDialog } from "@/components/features/orgs/create-org-dialog"
import { OrgCard } from "@/components/features/orgs/org-card"

export const Route = createFileRoute("/_auth/orgs/")({
  loader: async ({ context: { queryClient } }) => {
    await prefetch(queryClient, organizationsListOptions())
  },
  component: OrgsListPage,
})

function OrgsListPage() {
  const navigate = useNavigate()
  const { orgId } = useAuth()
  const { data: orgs, isLoading, error } = useOrganizations()
  const setActiveOrg = useSetActiveOrganization()
  const canCreateOrg = true
  const [showCreate, setShowCreate] = useState(false)

  const handleSelectOrg = async (id: string) => {
    try {
      await setActiveOrg.mutateAsync(id)
      navigate({ to: "/orgs/$orgId", params: { orgId: id } })
    } catch {
      toast.error("Failed to switch organization")
    }
  }

  // Auto-redirect to last active org, or to the only org (skip for super admins)
  useEffect(() => {
    if (!orgs || orgs.length === 0 || orgId) return
    if (canCreateOrg) return

    const lastOrgId = getLastActiveOrgId()
    const lastOrg = lastOrgId ? orgs.find((o) => o.id === lastOrgId) : null

    if (lastOrg) {
      handleSelectOrg(lastOrg.id)
    } else if (orgs.length === 1) {
      handleSelectOrg(orgs[0].id)
    }
  }, [orgs, orgId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">
            Error loading organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive/80">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Organizations</h1>
          <p className="text-muted-foreground">
            Select an organization to continue.
          </p>
        </div>
        {canCreateOrg && (
          <Button onClick={() => setShowCreate(true)}>
            Create Organization
          </Button>
        )}
      </div>

      <CreateOrgDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleSelectOrg}
      />

      {orgs && orgs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">No organizations yet</h3>
            {canCreateOrg ? (
              <>
                <p className="text-muted-foreground mb-4">
                  Create your first organization to get started.
                </p>
                <Button onClick={() => setShowCreate(true)}>
                  Create Organization
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">
                Contact your administrator to get access to an organization.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs?.map((org) => (
            <OrgCard key={org.id} org={org} onSelect={handleSelectOrg} />
          ))}
        </div>
      )}
    </div>
  )
}
