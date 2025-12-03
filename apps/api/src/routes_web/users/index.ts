import express, { type Router } from 'express'
import getUsersRouter from './get_users/get_users'
import getUserRouter from './get_user/get_user'
import addUserRouter from './add_user/add_user'
import updateUserRouter from './update_user/update_user'
import deleteUserRouter from './delete_user/delete_user'

const router: Router = express.Router()

// Mount all user routes
router.use('/', getUsersRouter)
router.use('/', getUserRouter)
router.use('/', addUserRouter)
router.use('/', updateUserRouter)
router.use('/', deleteUserRouter)

export default router
