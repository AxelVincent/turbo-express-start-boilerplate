import express, { type Router } from "express"
import { requireInternalAuth } from "../middlewares/require_internal_auth"

/**
 * Service-to-service routes — background workers, cron runners, and anything
 * else in the deployment that needs to call this API without a user session.
 * Mounted at /internal.
 *
 * Every route is behind INTERNAL_RPC_SECRET, so these must not be exposed
 * through a public ingress.
 */
const router: Router = express.Router()

router.use(requireInternalAuth)

export default router
