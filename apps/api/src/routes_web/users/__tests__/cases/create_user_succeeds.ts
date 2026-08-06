import type { Request } from "express"
import { v4 as uuid } from "uuid"
import { makeUserWithOrg } from "../../../../../tests/utils/user"
import { isTruthy, isEqual } from "../../../../../tests/utils/assertions"

export async function createUserSucceeds(_req: Request) {
  // Given
  const { user } = await makeUserWithOrg("users-create")
  const newName = `Test User ${uuid().substring(0, 8)}`
  const newEmail = `test+${uuid().substring(0, 8)}@example.com`

  // When
  const data = await user.me.createUser({ name: newName, email: newEmail })

  // Then
  isTruthy("response has user id", data.id)
  isEqual("name matches", data.name, newName)
  isEqual("email matches", data.email, newEmail)
}
