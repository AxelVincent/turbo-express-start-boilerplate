import { z } from "zod"

const envSchema = z.object({
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@example.com"),
  // Inbound email forwarding. All four are optional and have no defaults on
  // purpose — a boilerplate that shipped real addresses here would silently
  // forward a new product's mail to whoever the defaults named.
  RESEND_INBOUND_WEBHOOK_SECRET: z.string().optional(),
  INBOUND_ADDRESS: z.string().optional(),
  INBOUND_FORWARD_TO: z.string().optional(),
  INBOUND_FORWARD_FROM: z.string().optional(),
})

const env = envSchema.parse(process.env)

export const RESEND_CONFIG = {
  resendApiKey: env.RESEND_API_KEY,
  from: env.EMAIL_FROM,
  inboundWebhookSecret: env.RESEND_INBOUND_WEBHOOK_SECRET,
  inboundAddress: env.INBOUND_ADDRESS,
  inboundForwardTo: env.INBOUND_FORWARD_TO,
  inboundForwardFrom: env.INBOUND_FORWARD_FROM,
} as const

export interface InboundEmailConfig {
  webhookSecret: string
  address: string
  forwardTo: string
  forwardFrom: string
}

/**
 * Returns the inbound-forwarding config, or null when it isn't fully set up.
 * Partial configuration counts as unconfigured rather than half-working:
 * forwarding without a `from` bounces, and without the address filter every
 * message the catch-all receives would be forwarded.
 *
 * RESEND_API_KEY is part of the gate because `new Resend(undefined)` throws.
 * Constructing the client before this check would turn an unauthenticated
 * request into a 500 with a stack trace, on a route reachable by anyone.
 */
export function getInboundEmailConfig(): InboundEmailConfig | null {
  const {
    resendApiKey,
    inboundWebhookSecret,
    inboundAddress,
    inboundForwardTo,
    inboundForwardFrom,
  } = RESEND_CONFIG

  if (
    !resendApiKey ||
    !inboundWebhookSecret ||
    !inboundAddress ||
    !inboundForwardTo ||
    !inboundForwardFrom
  ) {
    return null
  }

  return {
    webhookSecret: inboundWebhookSecret,
    address: inboundAddress,
    forwardTo: inboundForwardTo,
    forwardFrom: inboundForwardFrom,
  }
}
