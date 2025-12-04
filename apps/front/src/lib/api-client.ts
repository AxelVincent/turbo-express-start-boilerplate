/**
 * API client for making requests to the Express backend.
 *
 * Can be used both server-side (in TanStack Router loaders) and client-side (in React components).
 *
 * The API URL is configured via the VITE_API_URL environment variable.
 * Make sure the API has CORS enabled if calling from the client side.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030'

interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  token?: string | null // Clerk session token
}

/**
 * Makes a type-safe request to the backend API.
 *
 * @param path - API endpoint path (e.g., '/web/users')
 * @param options - Request options (method, body, headers)
 * @returns Promise with the parsed response
 *
 * @example
 * ```ts
 * // In a route loader:
 * export const Route = createFileRoute('/users')({
 *   loader: async () => {
 *     const data = await apiClient<UserListResponse>('/web/users')
 *     return data
 *   }
 * })
 * ```
 */
export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options

  const url = `${API_URL}${path}`

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  // Add Clerk authentication token if provided
  if (token) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  if (body) {
    fetchOptions.body = JSON.stringify(body)
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const errorText = await response.text()

    // Handle authentication errors specifically
    if (response.status === 401) {
      throw new Error('Authentication required. Please sign in.')
    }

    if (response.status === 403) {
      throw new Error('Access denied. You do not have permission to perform this action.')
    }

    throw new Error(
      `API request failed: ${response.status} ${response.statusText}\n${errorText}`
    )
  }

  // Handle empty responses (e.g., 204 No Content)
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

/**
 * Helper function to build query strings from objects
 *
 * @example
 * ```ts
 * const query = buildQuery({ page: 1, pageSize: 10, search: 'john' })
 * // Returns: "?page=1&pageSize=10&search=john"
 * ```
 */
export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}
