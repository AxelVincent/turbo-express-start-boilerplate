import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import type { QueryClient } from "@tanstack/react-query"

import { AuthProvider } from "../lib/auth-provider"
import { ThemeProvider } from "../components/theme-provider"
import { Toaster } from "../components/ui/sonner"
import { NotFound } from "../components/NotFound"
import { APP_NAME } from "../lib/constants"

import appCss from "../styles.css?url"

export interface RouterContext {
  queryClient: QueryClient
  auth:
    | {
        isAuthenticated: boolean
        userId: string | undefined
        orgId: string | undefined
        orgSlug: string | undefined
        orgRole: string | undefined
        role: string | undefined
      }
    | undefined // undefined when auth is still loading
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: APP_NAME,
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </AuthProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="app-theme">
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
