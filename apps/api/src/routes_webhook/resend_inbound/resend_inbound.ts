import express, { type Router } from "express"
import { Resend } from "resend"
import { logger } from "@repo/logger"
import { withLogger } from "../../middlewares/with_logger"
import { getInboundEmailConfig } from "../../config/resend"

const router: Router = express.Router()

/**
 * Resend inbound webhook. Mail sent to INBOUND_ADDRESS is received by Resend,
 * which POSTs an `email.received` event here; we verify the Svix signature and
 * forward the message — body and attachments preserved — to INBOUND_FORWARD_TO.
 *
 * Setup: point the domain's MX records at Resend, create an inbound webhook in
 * the Resend dashboard aimed at `<public-url>/webhook/resend-inbound`, and put
 * the `whsec_…` signing secret it shows you in RESEND_INBOUND_WEBHOOK_SECRET.
 */
router.post(
  "/",
  withLogger(async (req, res) => {
    const config = getInboundEmailConfig()
    if (!config) {
      logger.error({
        msg: "Resend inbound webhook hit but inbound forwarding is not configured",
        event: "email.inbound.misconfigured",
      })
      // 500 so Resend retries once the configuration is fixed, rather than
      // dropping the message.
      res.status(500).json({ error: "webhook not configured" })
      return
    }

    const resend = new Resend(config.apiKey)

    let event
    try {
      // Verified against the raw bytes captured by the body-parser `verify`
      // hook — a re-serialized body would fail an otherwise valid signature.
      event = resend.webhooks.verify({
        payload: req.rawBody?.toString("utf8") ?? "",
        headers: {
          id: req.header("svix-id") ?? "",
          timestamp: req.header("svix-timestamp") ?? "",
          signature: req.header("svix-signature") ?? "",
        },
        webhookSecret: config.webhookSecret,
      })
    } catch (err) {
      logger.warn({
        msg: "Resend webhook signature verification failed",
        event: "email.inbound.verify_failed",
        metadata: { err: err instanceof Error ? err.message : String(err) },
      })
      res.status(401).json({ error: "invalid signature" })
      return
    }

    // One webhook can carry any subscribed event type; ack the rest so Resend
    // doesn't retry them.
    if (event.type !== "email.received") {
      res.status(200).json({ ignored: event.type })
      return
    }

    const { email_id, from, to, cc, bcc, subject } = event.data

    // The receiving MX is usually a catch-all on the root domain, so Resend
    // hands over every message for it. Only forward the ones actually
    // addressed to INBOUND_ADDRESS — recipients may arrive as "Name <addr>",
    // so match loosely.
    const inbox = config.address.toLowerCase()
    const addressed = [...to, ...cc, ...bcc].some((recipient) =>
      recipient.toLowerCase().includes(inbox),
    )
    if (!addressed) {
      res.status(200).json({ ignored: "recipient" })
      return
    }

    const { data, error } = await resend.emails.receiving.forward({
      emailId: email_id,
      to: config.forwardTo,
      from: config.forwardFrom,
    })

    if (error) {
      logger.error({
        msg: "Failed to forward inbound email",
        event: "email.inbound.forward_failed",
        metadata: { err: error, emailId: email_id, from, subject },
      })
      res.status(500).json({ error: "forward failed" })
      return
    }

    logger.info({
      msg: "Inbound email forwarded",
      event: "email.inbound.forwarded",
      metadata: {
        emailId: email_id,
        forwardedId: data?.id,
        originalFrom: from,
        originalTo: to,
        subject,
        forwardedTo: config.forwardTo,
      },
    })

    res.status(200).json({ forwarded: data?.id })
  }),
)

export default router
