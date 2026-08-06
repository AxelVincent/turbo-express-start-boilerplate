import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { useSetActiveOrganization } from "@/lib/hooks/use-organizations"
import { useAuth } from "@/lib/auth-provider"
import { useEffect } from "react"

export const Route = createFileRoute("/_auth/orgs/$orgId")({
  beforeLoad: ({ context }) => {
    if (context.auth?.isAuthenticated === false) {
      throw redirect({ to: "/signin" })
    }
  },
  component: OrgLayout,
})

function OrgLayout() {
  const { orgId } = Route.useParams()
  const auth = useAuth()
  const setActiveOrg = useSetActiveOrganization()

  useEffect(() => {
    // If the URL orgId differs from the session's active org, sync it
    if (auth.orgId && auth.orgId !== orgId) {
      setActiveOrg.mutate(orgId)
    }
  }, [orgId, auth.orgId])

  // Don't render child routes until the session's active org matches the URL
  if (auth.orgId && auth.orgId !== orgId) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <Outlet />
}
