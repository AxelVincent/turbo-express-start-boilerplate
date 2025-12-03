import { getDatabase } from '../../../db/database'
import type { User } from '../types'
import { mapDbUserToUser } from '../mapper'

export type UserQuery = {
  page: number
  pageSize: number
  search?: string
}

export async function getUsersQuery(
  query: UserQuery
): Promise<{ users: User[]; total: number }> {
  const db = getDatabase()
  const { page, pageSize, search } = query

  // Build base query
  let baseQuery = db.selectFrom('users')

  // Apply search filter if provided
  if (search) {
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb('name', 'ilike', `%${search}%`),
        eb('email', 'ilike', `%${search}%`),
      ])
    )
  }

  // Get total count
  const countResult = await baseQuery
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirst()
  const total = Number(countResult?.count ?? 0)

  // Get paginated results
  const offset = (page - 1) * pageSize
  const users = await baseQuery
    .selectAll()
    .orderBy('created_at', 'desc')
    .limit(pageSize)
    .offset(offset)
    .execute()

  return {
    users: users.map(mapDbUserToUser),
    total,
  }
}
