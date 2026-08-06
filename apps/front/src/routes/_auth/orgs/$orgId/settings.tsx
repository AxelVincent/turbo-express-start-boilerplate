import { createFileRoute } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"
import { useAuth } from "@/lib/auth-provider"
import { useOrgMembers } from "@/lib/hooks/use-org-members"
import { Skeleton } from "@/components/ui/skeleton"
import { OrgDetailsCard } from "@/components/features/settings/org-details-card"
import { PendingInvitationsCard } from "@/components/features/settings/pending-invitations-card"
import { MembersCard } from "@/components/features/settings/members-card"

export const Route = createFileRoute("/_auth/orgs/$orgId/settings")({
  component: OrgSettingsPage,
})

function OrgSettingsPage() {
  const { orgId } = Route.useParams()
  const { isPending: orgLoading } = authClient.useActiveOrganization()
  const { data: membersData, isPending: membersLoading } = useOrgMembers(orgId)
  const { userId: currentUserId, orgRole } = useAuth()

  const currentMember = membersData?.members?.find(
    (m: any) => m.userId === currentUserId,
  )
  const canEdit =
    currentMember?.role === "admin" ||
    currentMember?.role === "owner" ||
    orgRole === "admin" ||
    orgRole === "owner"

  if (orgLoading || membersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization and team members.
        </p>
      </div>

      <OrgDetailsCard orgId={orgId} canEdit={canEdit} />
      <PendingInvitationsCard orgId={orgId} canEdit={canEdit} />
      <MembersCard
        orgId={orgId}
        canEdit={canEdit}
        currentUserId={currentUserId}
      />
    </div>
  )
}
