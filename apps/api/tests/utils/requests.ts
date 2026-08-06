import { retry } from "@lifeomic/attempt"
import axios, { type AxiosRequestConfig, type Method } from "axios"
import { API_WEB_URL } from "./constants"

/**
 * Expected status code(s) or error + message combination.
 */
export type ExpectedResponseCode =
  | number
  | number[]
  | { errorStatusCode: 400 | 401 | 402 | 403 | 404 | 409; message: string }

export const getUrl = (path: string) => API_WEB_URL + path

export const sendRequest = async <T>(
  path: string,
  expectedCode: ExpectedResponseCode,
  config: AxiosRequestConfig,
): Promise<T> => {
  const result = await axios.request<T>(config).catch((error) => error.response)

  const status = result?.status

  if (Array.isArray(expectedCode)) {
    if (!expectedCode.includes(status)) {
      throw new Error(
        `${path}: expected one of [${expectedCode}], got ${status}`,
      )
    }
  } else if (typeof expectedCode === "object") {
    if (status !== expectedCode.errorStatusCode) {
      throw new Error(
        `${path}: expected ${expectedCode.errorStatusCode}, got ${status}`,
      )
    }
  } else {
    if (status !== expectedCode) {
      throw new Error(`${path}: expected ${expectedCode}, got ${status}`)
    }
  }

  return result?.data as T
}

// --- HTTP Methods (used by BaseUser to call production API endpoints) ---

export const get = async <T>(
  path: string,
  headers: Record<string, string>,
  expectedCode: ExpectedResponseCode = 200,
) =>
  sendRequest<T>(path, expectedCode, {
    url: getUrl(path),
    method: "GET",
    headers,
  })

export const post = async <T>(
  path: string,
  payload: unknown,
  expectedCode: ExpectedResponseCode,
  headers?: Record<string, string>,
) =>
  sendRequest<T>(path, expectedCode, {
    url: getUrl(path),
    method: "POST",
    data: payload,
    headers: headers || { "Content-Type": "application/json" },
  })

const withBodyAuthed =
  (verb: Method) =>
  async <T>(
    path: string,
    payload: unknown,
    headers: Record<string, string>,
    expectedCode: ExpectedResponseCode = 200,
  ) =>
    sendRequest<T>(path, expectedCode, {
      url: getUrl(path),
      data: payload,
      method: verb,
      headers,
    })

export const get_auth = async <T>(
  path: string,
  headers: Record<string, string>,
  expectedCode: ExpectedResponseCode = 200,
) =>
  sendRequest<T>(path, expectedCode, {
    url: getUrl(path),
    method: "GET",
    headers,
  })

export const post_auth = withBodyAuthed("POST")
export const patch_auth = withBodyAuthed("PATCH")
export const put_auth = withBodyAuthed("PUT")

export const del_auth = async <T>(
  path: string,
  headers: Record<string, string>,
  expectedCode: ExpectedResponseCode = 200,
) =>
  sendRequest<T>(path, expectedCode, {
    url: getUrl(path),
    method: "DELETE",
    headers,
  })

/**
 * POST with automatic retry on 423 (ResourceLocked).
 */
export const post_auth_with_lock_retry = async <T>(
  path: string,
  payload: unknown,
  headers: Record<string, string>,
  expectedCode: number | number[],
) =>
  retry(
    async () => {
      const codes = Array.isArray(expectedCode) ? expectedCode : [expectedCode]
      const response = await post_auth<T & { type?: string }>(
        path,
        payload,
        headers,
        [...codes, 423],
      )
      if ((response as any).type === "ResourceLockedError") {
        throw new Error("ResourceLockedError")
      }
      return response
    },
    {
      delay: 500,
      maxAttempts: 10,
      handleError: (err, context) => {
        if (err.message === "ResourceLockedError") return
        context.abort()
        throw err
      },
    },
  )
