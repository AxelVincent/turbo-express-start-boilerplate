/**
 * API client for making requests to the Express backend.
 *
 * Uses cookie-based authentication via Better Auth.
 * Cookies are sent automatically with credentials: 'include'.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3030"

interface ApiClientOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  headers?: Record<string, string>
}

/**
 * Makes a type-safe request to the backend API.
 *
 * @param path - API endpoint path (e.g., '/web/users')
 * @param options - Request options (method, body, headers)
 * @returns Promise with the parsed response
 */
export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options

  const url = `${API_URL}${path}`

  const fetchOptions: RequestInit = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  }

  if (body) {
    fetchOptions.body = JSON.stringify(body)
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication required. Please sign in.")
    }

    if (response.status === 403) {
      throw new Error(
        "Access denied. You do not have permission to perform this action.",
      )
    }

    // Try to extract a meaningful error message from the response
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`
    try {
      const errorBody = await response.json()
      if (errorBody.message) errorMessage = errorBody.message
      else if (errorBody.error) errorMessage = errorBody.error
    } catch {
      // Response is not JSON — use the default message
    }

    throw new Error(errorMessage)
  }

  // Handle empty responses (e.g., 204 No Content)
  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

/**
 * Helper function to build query strings from objects
 */
export function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ""
}
