import { z } from "zod"

const envSchema = z.object({
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_DEFAULT_CHANNEL: z.string().optional(),
})

const env = envSchema.parse(process.env)

export const SLACK_CONFIG = {
  botToken: env.SLACK_BOT_TOKEN,
  defaultChannel: env.SLACK_DEFAULT_CHANNEL,
} as const
