import express, { type Router } from 'express'
import { validateRequest } from '../../../middlewares/zod_validation'
import { userQuerySchema, usersResponseSchema } from './contract'
import { getUsersQuery } from '@services/users/queries/get_users'

const router: Router = express.Router()

// GET /web/users - List users with pagination and search
router.get(
  '/',
  validateRequest({
    querySchema: userQuerySchema,
    responseSchema: usersResponseSchema,
  }),
  async (req, res) => {
    const query = req.query

    const { users, total } = await getUsersQuery(query)

    res.json({
      users,
      total,
      page: query.page,
      pageSize: query.pageSize,
    })
  }
)

export default router
