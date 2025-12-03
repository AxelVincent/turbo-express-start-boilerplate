import { z } from 'zod'

// ===== SCHEMAS =====
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.array(z.any()).optional(),
})

// ===== TYPES =====
export type ErrorResponse = z.infer<typeof errorResponseSchema>
