import { getDatabase } from "../../src/db/database"
import { User } from "./user"

type UserFactory = () => Promise<User>

export class UserManager {
  /** Map of groupKey -> locked user IDs */
  private readonly lockedUsers = new Map<string, string[]>([["any", []]])
  /** Map of userId -> User object */
  private readonly users = new Map<string, User>()
  private newUsersCount = 0

  constructor(private readonly userFactory: UserFactory) {}

  get newUsers() {
    return this.newUsersCount
  }

  /**
   * Pre-create N users into the pool.
   * Called once during global setup.
   */
  async seed(count: number) {
    const results = await Promise.allSettled(
      Array.from({ length: count }, (_, i) =>
        this.userFactory().then((user) => {
          console.log(`Seeded user #${i + 1}/${count}`)
          this.register(user)
        }),
      ),
    )
    const succeeded = results.filter((r) => r.status === "fulfilled").length
    console.log(`${succeeded} test users were seeded.`)
  }

  /**
   * Get a user from the pool. Locks it to the given group key.
   * If no unlocked users are available, creates a new one.
   *
   * @param groupKey - Unique key per test suite (from x-test-user-seed header)
   * @param createNew - Force creation of a new user even if pool has available ones
   */
  async getUser(groupKey = "any", createNew = false): Promise<User> {
    const allLockedIds = [...this.lockedUsers.values()].flat()
    const unlockedIds = [...this.users.keys()].filter(
      (id) => !allLockedIds.includes(id),
    )

    if (unlockedIds.length === 0 || createNew) {
      const newUser = await this.userFactory()
      this.register(newUser)
      this.lockUser(groupKey, newUser.id)
      if (!createNew) this.newUsersCount++
      return newUser
    }

    // Pick a random unlocked user
    const randomId = unlockedIds[Math.floor(Math.random() * unlockedIds.length)]
    this.lockUser(groupKey, randomId)
    return this.users.get(randomId)!
  }

  /**
   * Clean up all orgs created by users in a test group, then release locks.
   * Called in afterAll() by createIntegrationTestSuite.
   * Org deletion cascades to all child data via DB FKs.
   */
  async unlockAllUsers(groupName: string) {
    const lockedIds = this.lockedUsers.get(groupName) || []
    const db = getDatabase()

    for (const userId of lockedIds) {
      const user = this.users.get(userId)
      if (!user) continue

      for (const orgId of user.createdOrgIds) {
        await db
          .deleteFrom("organization")
          .where("id", "=", orgId)
          .execute()
          .catch(() => {})
      }
      user.createdOrgIds.length = 0
    }

    this.lockedUsers.set(groupName, [])
  }

  private lockUser(groupName: string, userId: string) {
    let group = this.lockedUsers.get(groupName)
    if (!group) {
      group = []
      this.lockedUsers.set(groupName, group)
    }
    group.push(userId)
  }

  private register(user: User) {
    this.users.set(user.id, user)
  }
}
