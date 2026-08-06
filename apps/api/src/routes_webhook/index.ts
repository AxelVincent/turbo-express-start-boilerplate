import express, { type Router } from "express"
import resendInboundRouter from "./resend_inbound/resend_inbound"

/**
 * Inbound webhooks from third parties (Stripe, Resend, Slack…). Mounted at
 * /webhook, ahead of the auth middleware — the caller is a machine, not a user.
 *
 * There is no shared auth here on purpose: each provider signs differently, so
 * every route verifies its own signature. Verify against `req.rawBody` (the
 * exact bytes as received, captured by the body-parser `verify` hook in
 * server.ts) rather than a re-serialized `req.body`, or a payload that differs
 * only in key order or whitespace will fail an otherwise valid signature.
 */
const router: Router = express.Router()

router.use("/resend-inbound", resendInboundRouter)

export default router
