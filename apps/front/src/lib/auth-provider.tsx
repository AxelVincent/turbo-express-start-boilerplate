import { createContext, useContext, useRef } from "react"
import { authClient } from "./auth-client"
import type { RouterContext } from "../routes/__root"

export interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  userId: string | undefined
  orgId: string | undefined
  orgSlug: string | undefined
  orgRole: string | undefined
  role: string | undefined
  user:
    | { id: string; name: string; email: string; image: string | null }
    | undefined
}

const LOADING_AUTH: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  userId: undefined,
  orgId: undefined,
  orgSlug: undefined,
  orgRole: undefined,
  role: undefined,
  user: undefined,
}

const AuthContext = createContext<AuthState | null>(null)

/**
 * The actual provider that subscribes to Better Auth's session.
 * Only one instance ever subscribes — see AuthProvider below.
 */
function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession()
  const prevRef = useRef<AuthState | undefined>(undefined)

  let auth: AuthState

  if (isPending && !prevRef.current) {
    // Initial load — no data yet (matches SSR output)
    auth = LOADING_AUTH
  } else if (isPending && prevRef.current) {
    // Refetch in progress — return cached stable data
    auth = prevRef.current
  } else {
    // Settled — build from session
    const sessionRecord = session?.session as
      | Record<string, unknown>
      | undefined
    const userRecord = session?.user as Record<string, unknown> | undefined
    auth = {
      isLoading: false,
      isAuthenticated: !!session?.user,
      userId: session?.user?.id || undefined,
      orgId: sessionRecord?.activeOrganizationId as string | undefined,
      orgSlug: sessionRecord?.activeOrganizationSlug as string | undefined,
      orgRole: sessionRecord?.activeOrganizationRole as string | undefined,
      role: userRecord?.role as string | undefined,
      user: session?.user
        ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image ?? null,
          }
        : undefined,
    }
    prevRef.current = auth
  }

  return <AuthContext value={auth}>{children}</AuthContext>
}

/**
 * Idempotent auth provider. Placed in both entry-client.tsx (for router
 * context) and __root.tsx RootComponent (for SSR). When nested, the inner
 * instance is a no-op — only the outermost subscribes to useSession().
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const existing = useContext(AuthContext)
  if (existing) return <>{children}</>
  return <AuthProviderInner>{children}</AuthProviderInner>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}

export function toRouterAuth(auth: AuthState): RouterContext["auth"] {
  if (auth.isLoading) return undefined
  return {
    isAuthenticated: auth.isAuthenticated,
    userId: auth.userId,
    orgId: auth.orgId,
    orgSlug: auth.orgSlug,
    orgRole: auth.orgRole,
    role: auth.role,
  }
}

export function isSuperAdmin(role: string | undefined): boolean {
  return role === "super_admin"
}
