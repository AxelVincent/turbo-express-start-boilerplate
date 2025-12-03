import { z } from 'zod'
import { errorResponseSchema, type ErrorResponse } from '../../../types/errors'

// ===== SCHEMAS =====
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const userQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
  })
  .transform((data) => ({
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 10,
    search: data.search,
  }))

export const userListResponseSchema = z.object({
  users: z.array(userSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
})

export const usersResponseSchema = z.union([userListResponseSchema, errorResponseSchema])

// ===== TYPES =====
export type User = z.infer<typeof userSchema>
export type UserQuery = {
  page: number
  pageSize: number
  search?: string
}
export type UserListResponse = z.infer<typeof userListResponseSchema>
export type UsersResponse = UserListResponse | ErrorResponse
