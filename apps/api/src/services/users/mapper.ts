import type { DbUser, User } from "./types"

// Convert database Users to API User format
export function mapDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    createdAt: dbUser.created_at.toISOString(),
    updatedAt: dbUser.updated_at.toISOString(),
  }
}
