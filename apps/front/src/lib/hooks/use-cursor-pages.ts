import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"

/**
 * Shared wiring for cursor-paginated list endpoints, pairing with the API's
 * lib/cursor helpers. `fetchPage` receives the cursor ("" on the first page)
 * and returns a page whose `nextCursor` drives the next fetch. `items`
 * flattens the loaded pages; `firstPage` exposes first-page-only fields such
 * as a total count.
 *
 * Pass a stable `getItems` (module scope or useCallback) — an inline arrow
 * changes identity every render and re-flattens the whole list each time.
 */
export function useCursorPages<
  TPage extends { nextCursor: string | null },
  TItem,
>({
  queryKey,
  enabled,
  fetchPage,
  getItems,
  staleTime,
  refetchInterval,
}: {
  queryKey: readonly unknown[]
  enabled?: boolean
  fetchPage: (_cursor: string) => Promise<TPage>
  getItems: (_page: TPage) => TItem[]
  staleTime: number
  refetchInterval?: number | false
}) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: "",
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
    staleTime,
    refetchInterval,
  })
  const pages = query.data?.pages
  const items = useMemo(() => pages?.flatMap(getItems) ?? [], [pages, getItems])
  return {
    items,
    firstPage: pages?.[0],
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}
