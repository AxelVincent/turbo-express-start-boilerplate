import axios from "axios"
import { randomUUID as uuid } from "crypto"
import type { BaseUser } from "../base_user"

const API_URL = `http://localhost:${process.env.PORT || 3035}`

/**
 * Domain user for auth-related operations.
 */
export class AuthUser {
  constructor(private readonly user: BaseUser) {}

  /**
   * Attempt to sign up a new account via Better Auth.
   * Does NOT update the current user — used to test signup restrictions.
   */
  async signupNewAccount(
    overrides: { email?: string; password?: string; name?: string } = {},
    expectedCode = 200,
  ) {
    const email =
      overrides.email ?? `signup+${uuid().substring(0, 8)}@test.local`
    const response = await axios.post(
      `${API_URL}/api/auth/sign-up/email`,
      {
        email,
        password: overrides.password ?? "TestPass123!secure",
        name: overrides.name ?? "Signup Test User",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "user-agent": `test-signup-${uuid().substring(0, 8)}`,
        },
        validateStatus: () => true,
      },
    )

    if (expectedCode && response.status !== expectedCode) {
      throw new Error(
        `signupNewAccount: expected ${expectedCode}, got ${response.status}`,
      )
    }

    return { status: response.status, data: response.data }
  }
}
