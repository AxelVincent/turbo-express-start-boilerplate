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

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData
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
    // A FormData upload must let the browser set Content-Type itself so the
    // multipart boundary is included — setting it by hand breaks the upload.
    headers: isFormData(body)
      ? headers
      : { "Content-Type": "application/json", ...headers },
  }

  // Not `if (body)`: 0, false and "" are valid payloads that a truthiness
  // check would silently drop.
  if (body !== undefined && body !== null) {
    fetchOptions.body = isFormData(body) ? body : JSON.stringify(body)
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication required. Please sign in.")
    }

    // Seeded with a friendly default, then overridden by whatever the server
    // said — a specific message beats the generic one.
    let errorMessage =
      response.status === 403
        ? "Access denied. You do not have permission to perform this action."
        : `API request failed: ${response.status} ${response.statusText}`
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

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8) return decodeURIComponent(utf8[1])
  const plain = header.match(/filename="?([^";]+)"?/i)
  return plain ? plain[1] : null
}

/**
 * Fetches a binary file from the backend and triggers a browser download,
 * using cookie auth like `apiClient`. Prefers the server's Content-Disposition
 * filename and falls back to `fallbackFilename`.
 *
 * Note: the API must expose Content-Disposition via CORS for the filename to
 * be readable cross-origin — server.ts already does.
 */
export async function downloadFile(
  path: string,
  fallbackFilename: string,
): Promise<void> {
  const response = await fetch(`${API_URL}${path}`, { credentials: "include" })
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication required. Please sign in.")
    }
    let message = `Download failed: ${response.status} ${response.statusText}`
    try {
      const body = await response.json()
      if (body.message) message = body.message
      else if (body.error) message = body.error
    } catch {
      // not JSON — keep default message
    }
    throw new Error(message)
  }

  const filename =
    filenameFromContentDisposition(
      response.headers.get("Content-Disposition"),
    ) ?? fallbackFilename
  triggerDownload(await response.blob(), filename)
}

/**
 * Downloads an arbitrary (public) URL by fetching it as a blob first, so the
 * `download` filename is honoured even for cross-origin CDN assets — a plain
 * anchor `download` attribute is ignored cross-origin.
 */
export async function downloadUrl(
  url: string,
  filename: string,
): Promise<void> {
  triggerDownload(await (await fetch(url)).blob(), filename)
}

function triggerDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
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
