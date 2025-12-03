import { getDatabase } from '../../../db/database'
import type { User } from '../types'
import { mapDbUserToUser } from '../mapper'

export async function getUserByIdQuery(id: string): Promise<User | null> {
  const db = getDatabase()
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  return user ? mapDbUserToUser(user) : null
}
