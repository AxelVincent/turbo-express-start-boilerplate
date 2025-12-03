import { z } from 'zod'
import { errorResponseSchema, type ErrorResponse } from '../../../types/errors'

// ===== SCHEMAS =====
export const userParamsSchema = z.object({
  id: z.string().uuid(),
})

export const deleteUserResponseSchema = z.union([
  z.object({ success: z.boolean() }),
  errorResponseSchema,
])

// ===== TYPES =====
export type UserParams = z.infer<typeof userParamsSchema>
export type DeleteUserResponse = { success: boolean } | ErrorResponse
