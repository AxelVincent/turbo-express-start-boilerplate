import { useQuery } from "@tanstack/react-query"
import { authClient } from "../auth-client"

export const orgMembersKeys = {
  members: (orgId: string) => ["org-members", orgId] as const,
  invitations: (orgId: string) => ["org-invitations", orgId] as const,
}

export function useOrgMembers(orgId: string) {
  return useQuery({
    queryKey: orgMembersKeys.members(orgId),
    queryFn: async () => {
      const res = await authClient.organization.listMembers({
        query: { organizationId: orgId },
      })
      return res.data
    },
  })
}

export function useOrgInvitations(orgId: string) {
  return useQuery({
    queryKey: orgMembersKeys.invitations(orgId),
    queryFn: async () => {
      const res = await authClient.organization.listInvitations({
        query: { organizationId: orgId },
      })
      return res.data
    },
  })
}
