import type { Request } from "express"
import { makeUserWithOrg } from "../../../../../tests/utils/user"
import {
  isTruthy,
  isGreaterThanOrEqual,
} from "../../../../../tests/utils/assertions"

export async function getUsersReturnsList(_req: Request) {
  // Given
  const { user } = await makeUserWithOrg("users-list")

  // When
  const data = await user.me.getUsers()

  // Then
  isTruthy("response has users array", Array.isArray(data.users))
  isGreaterThanOrEqual("total is at least 1", data.total, 1)
}
