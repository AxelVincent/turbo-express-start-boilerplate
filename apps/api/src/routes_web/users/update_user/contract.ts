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

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
})

export const userParamsSchema = z.object({
  id: z.string().uuid(),
})

export const updateUserResponseSchema = z.union([userSchema, errorResponseSchema])

// ===== TYPES =====
export type User = z.infer<typeof userSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserParams = z.infer<typeof userParamsSchema>
export type UpdateUserResponse = User | ErrorResponse
