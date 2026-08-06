import type { Request } from "express"
import { v4 as uuid } from "uuid"
import { makeUserWithOrg } from "../../../../../tests/utils/user"
import { isEqual } from "../../../../../tests/utils/assertions"

export async function updateUserRole(_req: Request) {
  // Given
  const { user } = await makeUserWithOrg("users-update")
  const name = `UpdateTest ${uuid().substring(0, 8)}`
  const email = `update+${uuid().substring(0, 8)}@example.com`
  const created = await user.me.createUser({ name, email })

  // When
  const data = await user.me.updateUser(created.id, { role: "admin" })

  // Then
  isEqual("role is updated", data.role, "admin")
  isEqual("name is unchanged", data.name, name)
}
