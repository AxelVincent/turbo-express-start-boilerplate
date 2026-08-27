import { Resend } from "resend"
import { logger } from "@repo/logger"
import { RESEND_CONFIG } from "../../config/resend"

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
}

interface SendEmailResult {
  id: string
}

export async function sendEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const { to, subject, html } = params

  if (process.env.NODE_ENV === "development" && !RESEND_CONFIG.resendApiKey) {
    logger.info({
      msg: "[email dev fallback] Would send email",
      event: "email.dev_fallback",
      metadata: { to, subject },
    })
    return { id: `dev-${Date.now()}` }
  }

  if (!RESEND_CONFIG.resendApiKey) {
    throw new Error(
      "RESEND_API_KEY is required in non-development environments",
    )
  }

  const resend = new Resend(RESEND_CONFIG.resendApiKey)

  const { data, error } = await resend.emails.send({
    from: RESEND_CONFIG.from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  })

  if (error) {
    logger.error({
      msg: "Failed to send email via Resend",
      event: "email.send_failed",
      metadata: { err: error, to, subject },
    })
    throw new Error(`Resend API error: ${error.message}`)
  }

  logger.info({
    msg: "Email sent successfully",
    event: "email.sent",
    metadata: { emailId: data?.id, to, subject },
  })
  return { id: data!.id }
}

export function verifyInboundWebhook({
  webhookSecret,
  payload,
  headers,
}: {
  webhookSecret: string
  payload: string
  headers: { id: string; timestamp: string; signature: string }
}) {
  return new Resend(RESEND_CONFIG.resendApiKey).webhooks.verify({
    payload,
    headers,
    webhookSecret,
  })
}

export function forwardInboundEmail({
  emailId,
  to,
  from,
}: {
  emailId: string
  to: string
  from: string
}) {
  return new Resend(RESEND_CONFIG.resendApiKey).emails.receiving.forward({
    emailId,
    to,
    from,
  })
}
