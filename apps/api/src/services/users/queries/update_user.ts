import { getDatabase } from '../../../db/database'
import type { User, UpdateUserInput } from '../types'
import { mapDbUserToUser } from '../mapper'

export async function updateUserQuery(
  id: string,
  input: UpdateUserInput
): Promise<User | null> {
  const db = getDatabase()

  // Check if user exists
  const existingUser = await db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  if (!existingUser) {
    return null
  }

  // Update user
  const updatedUser = await db
    .updateTable('users')
    .set({
      ...(input.name && { name: input.name }),
      ...(input.email && { email: input.email }),
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow()

  return mapDbUserToUser(updatedUser)
}
