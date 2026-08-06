import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router"
import { useEffect } from "react"

import { authClient } from "@/lib/auth-client"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/sidebar/AppSidebar"

/**
 * Admin layout route
 * All routes under /_admin require authentication + admin role
 */
export const Route = createFileRoute("/_admin")({
  beforeLoad: ({ context, location }) => {
    if (context.auth?.isAuthenticated === false) {
      throw redirect({
        to: "/signin",
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  const user = session?.user
  const isAdmin = user?.role === "admin" || user?.role === "super_admin"

  useEffect(() => {
    if (!isPending && !user) {
      navigate({ to: "/signin" })
    }
  }, [isPending, user, navigate])

  useEffect(() => {
    if (!isPending && user && !isAdmin) {
      navigate({ to: "/" })
    }
  }, [isPending, user, isAdmin, navigate])

  if (isPending) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="admin" />
      <div className="flex flex-1 flex-col overflow-auto [scrollbar-gutter:stable] [&>*]:w-full w-full p-5">
        <Outlet />
      </div>
    </SidebarProvider>
  )
}
