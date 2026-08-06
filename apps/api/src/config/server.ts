import { z } from "zod"

const envSchema = z.object({
  PORT: z.coerce.number().default(3030),
  BASE_URL: z.string().url().default("http://localhost:3030"),
  CORS_ORIGIN: z.string().default("*"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NODE_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),
  FRONTEND_BASE_URL: z.string().default("http://localhost:5173"),
})

const env = envSchema.parse(process.env)

export const SERVER_CONFIG = {
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN,
  logLevel: env.LOG_LEVEL,
  nodeEnv: env.NODE_ENV,
  frontendBaseURL: env.FRONTEND_BASE_URL,
  baseURL: env.BASE_URL,
} as const
