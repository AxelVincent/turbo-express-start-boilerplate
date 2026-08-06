import { hydrateRoot } from "react-dom/client"
import { RouterProvider } from "@tanstack/react-router"
import { useMemo, StrictMode } from "react"
import { getRouter } from "./router"
import { AuthProvider, useAuth, toRouterAuth } from "./lib/auth-provider"

function InnerApp() {
  const auth = useAuth()
  const router = useMemo(() => getRouter(), [])

  return (
    <RouterProvider router={router} context={{ auth: toRouterAuth(auth) }} />
  )
}

hydrateRoot(
  document,
  <StrictMode>
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  </StrictMode>,
)
