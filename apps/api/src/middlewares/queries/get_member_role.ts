import { getDatabase } from "../../db/database"

export async function getMemberRoleQuery(
  organizationId: string,
  userId: string,
): Promise<string> {
  const db = getDatabase()

  const member = await db
    .selectFrom("member")
    .select(["role"])
    .where("organization_id", "=", organizationId)
    .where("user_id", "=", userId)
    .executeTakeFirst()

  return member?.role || ""
}
