import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router"
import { useEffect } from "react"

import { useAuth } from "@/lib/auth-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/sidebar/AppSidebar"
import { OrgSwitcher } from "@/components/layout/sidebar/OrgSwitcher"
import { Separator } from "@/components/ui/separator"

/**
 * Protected layout route
 * All routes under /_auth require authentication
 * Unauthenticated users are redirected to signin page
 */
export const Route = createFileRoute("/_auth")({
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
  component: AuthLayout,
})

function AdminHeader() {
  const { orgId } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      {orgId && (
        <div className="flex items-center gap-1">
          <OrgSwitcher currentOrgId={orgId} variant="header" />
        </div>
      )}
      <div className="flex-1" />
    </header>
  )
}

function AuthLayout() {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate({ to: "/signin" })
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate])

  if (auth.isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <AdminHeader />
        <div className="flex flex-1 flex-col overflow-auto [scrollbar-gutter:stable] [&>*]:w-full p-5">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  )
}
