import express, { type Router } from 'express'
import { requireAuth } from '../middlewares/require_auth'
import usersRouter from './users'

const router: Router = express.Router()

// Protect ALL /web routes with authentication
router.use(requireAuth)

// Mount users router
router.use('/users', usersRouter)

export default router