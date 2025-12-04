import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/sidebar/AppSidebar'
import { Separator } from '@/components/ui/separator'

/**
 * Protected layout route
 * All routes under /_auth require authentication
 * Unauthenticated users are redirected to login page
 */
export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    // Only redirect if we know for sure the user is not authenticated
    if (context.auth?.isAuthenticated === false) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Once Clerk loads, verify authentication and redirect if needed
    if (isLoaded && !isSignedIn) {
      navigate({ to: '/login' })
    }
  }, [isLoaded, isSignedIn, navigate])

  // Show loading spinner while auth is loading
  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render content if not signed in (redirect will happen via useEffect)
  if (!isSignedIn) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
