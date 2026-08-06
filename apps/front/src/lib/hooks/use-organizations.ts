import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query"
import { authClient } from "../auth-client"

export interface Organization {
  id: string
  name: string
  slug: string
  logo: string | null
  role: string
}

// Query keys factory
export const organizationsKeys = {
  all: ["organizations"] as const,
  list: () => [...organizationsKeys.all, "list"] as const,
}

// Query options — reusable in both hooks and route loaders
export const organizationsListOptions = () =>
  queryOptions({
    queryKey: organizationsKeys.list(),
    queryFn: async () => {
      const result = await authClient.organization.list()
      return (result.data ?? []) as unknown as Organization[]
    },
    staleTime: 60 * 1000,
  })

export function useOrganizations() {
  return useQuery(organizationsListOptions())
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; slug: string }) => {
      const result = await authClient.organization.create({
        name: input.name,
        slug: input.slug,
      })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all })
    },
  })
}

const LAST_ORG_KEY = "app:lastOrgId"

export function getLastActiveOrgId(): string | null {
  try {
    return localStorage.getItem(LAST_ORG_KEY)
  } catch {
    return null
  }
}

export function useSetActiveOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await authClient.organization.setActive({
        organizationId,
      })
      // Wait for session to reflect the new org before returning
      await authClient.getSession({ query: { disableCookieCache: true } })
      return result
    },
    onSuccess: (_data, organizationId) => {
      try {
        localStorage.setItem(LAST_ORG_KEY, organizationId)
      } catch {
        // localStorage unavailable
      }
      // Remove all org-specific cached data so no stale cross-org data is served
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "organizations",
      })
    },
  })
}
