import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  useOrganizations,
  useCreateOrganization,
  useSetActiveOrganization,
  getLastActiveOrgId,
  organizationsListOptions,
} from "@/lib/hooks/use-organizations"
import { prefetch } from "@/lib/query-client"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const createOrg = useCreateOrganization()
  const canCreateOrg = true
  const [showCreate, setShowCreate] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [newOrgSlug, setNewOrgSlug] = useState("")

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

  const handleSelectOrg = async (id: string) => {
    try {
      await setActiveOrg.mutateAsync(id)
      navigate({ to: "/orgs/$orgId", params: { orgId: id } })
    } catch {
      toast.error("Failed to switch organization")
    }
  }

  const handleCreateOrg = async () => {
    if (!newOrgName.trim() || !newOrgSlug.trim()) return
    try {
      const result = await createOrg.mutateAsync({
        name: newOrgName.trim(),
        slug: newOrgSlug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-"),
      })
      setShowCreate(false)
      setNewOrgName("")
      setNewOrgSlug("")
      if (result?.data?.id) {
        handleSelectOrg(result.data.id)
      }
    } catch (err) {
      toast.error("Failed to create organization", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    }
  }

  const handleNameChange = (name: string) => {
    setNewOrgName(name)
    setNewOrgSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    )
  }

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
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>Create Organization</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
                <DialogDescription>
                  Create a new organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Name</Label>
                  <Input
                    id="org-name"
                    value={newOrgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="My Organization"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-slug">Slug</Label>
                  <Input
                    id="org-slug"
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value)}
                    placeholder="my-organization"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs. Only lowercase letters, numbers, and hyphens.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrg}
                  disabled={
                    !newOrgName.trim() ||
                    !newOrgSlug.trim() ||
                    createOrg.isPending
                  }
                >
                  {createOrg.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

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
            <Card
              key={org.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleSelectOrg(org.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {org.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">/{org.slug}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-xs capitalize">
                  {org.role}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
