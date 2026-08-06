import { z } from "zod"
import { SERVER_CONFIG } from "./server"

const envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
})

const env = envSchema.parse(process.env)

// Better Auth appends basePath (/api/auth) to baseURL, so pass origin only
const betterAuthBaseURL = new URL(SERVER_CONFIG.baseURL).origin

export const BETTER_AUTH_CONFIG = {
  secret: env.BETTER_AUTH_SECRET,
  baseURL: betterAuthBaseURL,
  trustedOrigins: SERVER_CONFIG.frontendBaseURL.split(","),
  oauth: {
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
  },
} as const
