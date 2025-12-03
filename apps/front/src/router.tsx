import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { createQueryClient } from './lib/query-client'

// Create a new router instance
export function getRouter() {
  const queryClient = createQueryClient()

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: {
      queryClient,
    },
  })

  // Set up SSR Query integration
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}

// Register the router instance for type-safe usage
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
