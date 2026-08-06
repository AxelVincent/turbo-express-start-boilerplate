export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const

const ADMIN_ROLES: readonly string[] = [
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
]

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role)
}
