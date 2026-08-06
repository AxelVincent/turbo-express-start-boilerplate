import express, { type Router } from "express"

/**
 * Unauthenticated, publicly reachable routes — waitlist signups, marketing
 * form posts, status pages. Mounted at /public.
 *
 * Nothing here sees req.auth, so treat every input as hostile and rate-limit
 * anything that writes. Routes that need a signed in user belong in
 * routes_web; routes called by another service belong in routes_internal.
 */
const router: Router = express.Router()

export default router
