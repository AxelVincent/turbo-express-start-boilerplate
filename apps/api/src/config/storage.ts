import { z } from "zod"

// Optional so local development, which uses the filesystem provider, doesn't
// need S3 credentials just to boot. Completeness is checked in
// requireS3Config(), at the point the S3 provider is actually constructed.
const envSchema = z.object({
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
})

const env = envSchema.parse(process.env)

export const STORAGE_CONFIG = {
  endpoint: env.S3_ENDPOINT,
  bucket: env.S3_BUCKET,
  region: env.S3_REGION,
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
} as const

export interface S3Config {
  endpoint: string
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
}

export function requireS3Config(): S3Config {
  const missing = Object.entries(STORAGE_CONFIG)
    .filter(([, value]) => !value)
    .map(([key]) => `S3_${key.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`)

  if (missing.length > 0) {
    throw new Error(
      `S3 storage is selected but not configured. Missing: ${missing.join(", ")}`,
    )
  }
  return STORAGE_CONFIG as S3Config
}
