import { randomUUID as uuid } from "crypto"
import { getDatabase } from "../../../src/db/database"
import type { BaseUser } from "../base_user"

/**
 * Domain user for organization operations.
 *
 * Bypasses Better Auth's super_admin requirement for org creation
 * by inserting directly into the DB — no API route exists for
 * non-super-admin users.
 */
export class OrgsUser {
  constructor(private readonly user: BaseUser) {}

  /**
   * Create an organization and make the user an owner.
   * Sets it as the active org on the user's session.
   */
  async createOrg(
    overrides: { name?: string; slug?: string } = {},
  ): Promise<string> {
    const db = getDatabase()
    const orgId = uuid()

    await db
      .insertInto("organization")
      .values({
        id: orgId,
        name: overrides.name ?? `Test Org ${orgId.substring(0, 8)}`,
        slug: overrides.slug ?? `test-org-${uuid().substring(0, 8)}`,
        created_at: new Date(),
      })
      .execute()

    await db
      .insertInto("member")
      .values({
        id: uuid(),
        organization_id: orgId,
        user_id: this.user.id,
        role: "owner",
        created_at: new Date(),
      })
      .execute()

    // Set as active org on the user's session
    await db
      .updateTable("session")
      .set({ active_organization_id: orgId })
      .where("user_id", "=", this.user.id)
      .execute()

    this.user.orgId = orgId
    this.user.createdOrgIds.push(orgId)

    return orgId
  }

  /**
   * Create an invitation for a given email to join an org.
   */
  async createInvitation(
    orgId: string,
    email: string,
    inviterId: string,
    status: "pending" | "accepted" = "pending",
  ): Promise<void> {
    const db = getDatabase()
    await db
      .insertInto("invitation")
      .values({
        id: uuid(),
        organization_id: orgId,
        email,
        role: "member",
        status,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        inviter_id: inviterId,
        created_at: new Date(),
      })
      .execute()
  }

  /**
   * Clean up test data created by a signup-with-invitation test.
   */
  async cleanupInvitationTestData(
    orgId: string,
    email: string,
    signedUpUserId?: string,
  ): Promise<void> {
    const db = getDatabase()
    if (signedUpUserId) {
      await db
        .deleteFrom("session")
        .where("user_id", "=", signedUpUserId)
        .execute()
      await db
        .deleteFrom("account")
        .where("user_id", "=", signedUpUserId)
        .execute()
      await db.deleteFrom("user").where("id", "=", signedUpUserId).execute()
    }
    await db
      .deleteFrom("invitation")
      .where("organization_id", "=", orgId)
      .execute()
    await db
      .deleteFrom("verification")
      .where("identifier", "=", email)
      .execute()
  }

  /**
   * Remove an organization from the DB.
   * All related data (members, etc.) is cascade-deleted by the DB.
   */
  async deleteOrg(orgId: string): Promise<void> {
    const db = getDatabase()
    await db.deleteFrom("organization").where("id", "=", orgId).execute()
  }
}
