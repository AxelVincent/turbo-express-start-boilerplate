import IORedis from "ioredis"
import { z } from "zod"

const envSchema = z.object({
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_USER: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
})

const env = envSchema.parse(process.env)

const REDIS_CONFIG = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  username: env.REDIS_USER,
  password: env.REDIS_PASSWORD,
} as const

let client: IORedis | null = null

export function getRedis(): IORedis {
  if (!client) {
    // BullMQ requires `maxRetriesPerRequest: null` so the blocking commands a
    // worker uses for long-polling don't get cancelled. Sharing this single
    // client with the rate limiter is fine — ioredis multiplexes commands.
    client = new IORedis({ ...REDIS_CONFIG, maxRetriesPerRequest: null })
  }
  return client
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit()
    client = null
  }
}
