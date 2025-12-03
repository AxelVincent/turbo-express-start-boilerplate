import { getDatabase } from '../../../db/database'

export async function deleteUserQuery(id: string): Promise<boolean> {
  const db = getDatabase()
  const result = await db
    .deleteFrom('users')
    .where('id', '=', id)
    .executeTakeFirst()

  return Number(result.numDeletedRows) > 0
}
