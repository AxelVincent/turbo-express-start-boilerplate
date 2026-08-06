import { getDatabase } from "../../../db/database"
import type { User, CreateUserInput } from "../types"
import { mapDbUserToUser } from "../mapper"

export async function createUserQuery(input: CreateUserInput): Promise<User> {
  const db = getDatabase()
  const newUser = await db
    .insertInto("user")
    .values({
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      email_verified: false,
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return mapDbUserToUser(newUser)
}
