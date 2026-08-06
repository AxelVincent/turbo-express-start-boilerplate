import {
  QueryClient,
  type QueryKey,
  type EnsureQueryDataOptions,
} from "@tanstack/react-query"

/**
 * Whether we're running on the server (SSR).
 * During SSR the API client can't reach the backend (VITE_API_URL is client-only),
 * so we skip data prefetching and let the client hydrate with loading states.
 */
const isServer = typeof window === "undefined"

/**
 * Prefetch query data in route loaders. Skips SSR (API client can't reach
 * backend) and swallows errors so a failed prefetch doesn't crash the route.
 * Components handle loading/error states via useQuery.
 */
export function prefetch<T, TQueryKey extends QueryKey>(
  queryClient: QueryClient,
  options: EnsureQueryDataOptions<T, Error, T, TQueryKey>,
): Promise<T | undefined> {
  if (isServer) return Promise.resolve(undefined)
  return queryClient.ensureQueryData(options).catch(() => undefined)
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (user errors)
          if (error instanceof Error && "status" in error) {
            const status = (error as any).status
            if (status >= 400 && status < 500) {
              return false
            }
          }
          return failureCount < 3
        },
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
