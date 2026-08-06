import axios from "axios"
import { User } from "../user/user"
import { UserManager } from "../user/user_manager"
import { API_URL } from "./constants"

/**
 * Sign up a user via Better Auth's email/password endpoint.
 * This calls the real running Express server.
 */
async function signupUser(user: User): Promise<void> {
  // Sign up via Better Auth
  const signupResponse = await axios.post(
    `${API_URL}/api/auth/sign-up/email`,
    {
      email: user.email,
      password: user.password,
      name: user.name,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "user-agent": user.userAgent,
      },
    },
  )

  const data = signupResponse.data

  if (data.user) {
    user.id = data.user.id
  }

  if (data.token) {
    user.token = data.token
  }

  // Extract session token from set-cookie header
  const setCookie = signupResponse.headers["set-cookie"]
  if (setCookie) {
    for (const cookie of setCookie) {
      const match = cookie.match(/better-auth\.session_token=([^;]+)/)
      if (match) {
        user.sessionToken = match[1]
        break
      }
    }
  }
}

/**
 * The main user manager instance.
 * Used by the seed endpoint and by test handlers via makeUser().
 */
export const userManager = new UserManager(async () => {
  const user = new User()
  await signupUser(user)
  return user
})

/**
 * Create a fully registered user ready for testing.
 * Uses the pool when possible, creates new users when needed.
 *
 * @param groupKey - Pass the x-test-user-seed header value for isolation
 */
export async function makeUser(groupKey?: string): Promise<User> {
  return userManager.getUser(groupKey)
}

/**
 * Create a new user (always fresh, never from pool).
 */
export async function makeNewUser(groupKey?: string): Promise<User> {
  return userManager.getUser(groupKey, true)
}

/**
 * Create a user with an active organization context.
 * Returns both the user and the orgId.
 */
export async function makeUserWithOrg(
  groupKey?: string,
  options: { newUser?: boolean } = {},
): Promise<{ user: User; orgId: string }> {
  const user = options.newUser
    ? await makeNewUser(groupKey)
    : await makeUser(groupKey)
  const orgId = await user.orgs.createOrg()
  return { user, orgId }
}
