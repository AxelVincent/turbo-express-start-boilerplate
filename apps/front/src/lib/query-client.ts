import { QueryClient } from '@tanstack/react-query'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server-side: no retries, no refetching
        // Client-side: standard behavior
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && 'status' in error) {
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
