import { z } from 'zod'

const envSchema = z.object({
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
})

const env = envSchema.parse(process.env)

export const CLERK_CONFIG = {
  API_KEYS: {
    PUBLIC_KEY: env.CLERK_PUBLISHABLE_KEY,
    SECRET_KEY: env.CLERK_SECRET_KEY,
    WEBHOOK_SECRET: env.CLERK_WEBHOOK_SECRET,
  },
} as const
