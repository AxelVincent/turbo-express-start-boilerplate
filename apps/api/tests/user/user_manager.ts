import { User } from "./user"

type UserFactory = () => Promise<User>

export class UserManager {
  /** Map of groupKey -> users created under that key, for cleanup */
  private readonly createdByGroup = new Map<string, User[]>()
  private usersCreatedCount = 0

  constructor(private readonly userFactory: UserFactory) {}

  get usersCreated() {
    return this.usersCreatedCount
  }

  /**
   * Create a brand-new, real user. Never reused — every test gets its own.
   *
   * @param groupKey - Unique key per test suite (from the x-test-user-seed header), used only to group cleanup
   */
  async getUser(groupKey = "any"): Promise<User> {
    const user = await this.userFactory()
    this.usersCreatedCount++

    const group = this.createdByGroup.get(groupKey) ?? []
    group.push(user)
    this.createdByGroup.set(groupKey, group)

    return user
  }

  /**
   * Delete all orgs created by users in a test group.
   * Called in afterAll() by createIntegrationTestSuite.
   * Org deletion cascades to all child data via DB FKs.
   */
  async cleanupGroup(groupKey: string) {
    const users = this.createdByGroup.get(groupKey) ?? []

    await Promise.allSettled(
      users.flatMap((user) => user.createdOrgIds.map((orgId) => user.orgs.deleteOrg(orgId))),
    )
    for (const user of users) {
      user.createdOrgIds.length = 0
    }

    this.createdByGroup.delete(groupKey)
  }
}
