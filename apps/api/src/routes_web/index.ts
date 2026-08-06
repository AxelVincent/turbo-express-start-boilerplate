import express, { type Router } from "express"
import { requireAuth } from "../middlewares/require_auth"
import { requireOrg } from "../middlewares/require_org"
import usersRouter from "./users"

const router: Router = express.Router()

// Protect ALL /web routes with authentication and org context
router.use(requireAuth)
router.use(requireOrg)

// Mount users router
router.use("/users", usersRouter)

export default router
