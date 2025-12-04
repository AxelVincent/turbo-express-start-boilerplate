import { hydrateRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { useMemo } from 'react'
import { getRouter } from './router'

function InnerApp() {
  const { isLoaded, isSignedIn, userId } = useAuth()

  // Create router instance once
  const router = useMemo(() => getRouter(), [])

  // Provide auth context immediately, even if not loaded yet
  // This allows the app to render optimistically while auth loads in the background
  return (
    <RouterProvider
      router={router}
      context={{
        auth: isLoaded
          ? {
              isAuthenticated: isSignedIn || false,
              userId: userId || undefined,
            }
          : undefined, // undefined means auth is still loading
      }}
    />
  )
}

hydrateRoot(document, <InnerApp />)
