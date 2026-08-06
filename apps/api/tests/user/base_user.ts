import { randomUUID as uuid } from "crypto"
import {
  get_auth,
  post_auth,
  patch_auth,
  put_auth,
  del_auth,
  post_auth_with_lock_retry,
  type ExpectedResponseCode,
} from "../utils/requests"

export type BaseUserConstructorArgs = {
  email?: string
  name?: string
  password?: string
}

export class BaseUser {
  id = ""
  token: string | null = null
  sessionToken: string | null = null
  deviceId = uuid()
  name: string
  email: string
  password: string
  userAgent: string

  // Organization context
  orgId = ""
  orgRole = ""

  /** Org IDs created by this user during tests — auto-cleaned on unlock. */
  readonly createdOrgIds: string[] = []

  constructor({ email, name, password }: BaseUserConstructorArgs = {}) {
    const uniqueId = uuid().substring(0, 8)
    this.name = name || `Test User ${uniqueId}`
    this.email = email ?? `test+${uniqueId}@example.com`
    this.password = password ?? `TestPass123!${uniqueId}`
    this.userAgent = `boilerplate.test-${uniqueId}`
  }

  /** Returns headers with this user's auth token + session cookie. */
  headers(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "user-agent": this.userAgent,
    }

    // Better Auth uses cookies for session, but also supports Bearer token
    if (this.sessionToken) {
      headers["cookie"] = `better-auth.session_token=${this.sessionToken}`
    }
    if (this.token) {
      headers["authorization"] = `Bearer ${this.token}`
    }

    return headers
  }

  get displayName() {
    return this.name
  }

  // --- HTTP method wrappers that auto-inject this user's auth headers ---

  async get_auth<T>(path: string, expectedCode: ExpectedResponseCode = 200) {
    return get_auth<T>(path, this.headers(), expectedCode)
  }

  async post_auth<T>(
    path: string,
    payload: unknown,
    expectedCode: ExpectedResponseCode = 200,
  ) {
    return post_auth<T>(path, payload, this.headers(), expectedCode)
  }

  async patch_auth<T>(
    path: string,
    payload: unknown,
    expectedCode: ExpectedResponseCode = 200,
  ) {
    return patch_auth<T>(path, payload, this.headers(), expectedCode)
  }

  async put_auth<T>(
    path: string,
    payload: unknown,
    expectedCode: ExpectedResponseCode = 200,
  ) {
    return put_auth<T>(path, payload, this.headers(), expectedCode)
  }

  async del_auth<T>(path: string, expectedCode: ExpectedResponseCode = 200) {
    return del_auth<T>(path, this.headers(), expectedCode)
  }

  async post_auth_with_lock_retry<T>(
    path: string,
    payload: unknown,
    expectedCode: number | number[],
  ) {
    return post_auth_with_lock_retry<T>(
      path,
      payload,
      this.headers(),
      expectedCode,
    )
  }
}
