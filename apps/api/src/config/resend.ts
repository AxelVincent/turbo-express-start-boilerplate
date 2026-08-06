import { z } from "zod"

const envSchema = z.object({
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@example.com"),
})

const env = envSchema.parse(process.env)

export const RESEND_CONFIG = {
  resendApiKey: env.RESEND_API_KEY,
  from: env.EMAIL_FROM,
} as const
