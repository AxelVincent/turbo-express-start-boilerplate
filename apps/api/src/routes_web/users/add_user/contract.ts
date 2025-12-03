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

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
})

export const createUserResponseSchema = z.union([userSchema, errorResponseSchema])

// ===== TYPES =====
export type User = z.infer<typeof userSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreateUserResponse = User | ErrorResponse
