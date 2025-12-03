import { getDatabase } from '../../../db/database'
import type { User, CreateUserInput } from '../types'
import { mapDbUserToUser } from '../mapper'

export async function createUserQuery(input: CreateUserInput): Promise<User> {
  const db = getDatabase()
  const newUser = await db
    .insertInto('users')
    .values({
      name: input.name,
      email: input.email,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return mapDbUserToUser(newUser)
}
