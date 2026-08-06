import type { Request } from "express"
import { v4 as uuid } from "uuid"
import { makeUserWithOrg } from "../../../../../tests/utils/user"
import { isTruthy } from "../../../../../tests/utils/assertions"

export async function deleteUserSucceeds(_req: Request) {
  // Given
  const { user } = await makeUserWithOrg("users-delete")
  const name = `DeleteTest ${uuid().substring(0, 8)}`
  const email = `delete+${uuid().substring(0, 8)}@example.com`
  const created = await user.me.createUser({ name, email })

  // When
  await user.me.deleteUser(created.id)

  // Then
  await user.me.getUser(created.id, 404)
  isTruthy("user is deleted (get returns 404)", true)
}
