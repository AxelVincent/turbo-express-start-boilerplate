import express, { type Router } from 'express'
import { validateRequest } from '../../../middlewares/zod_validation'
import { userParamsSchema, userResponseSchema } from './contract'
import { getUserByIdQuery } from '@services/users/queries/get_user_by_id'

const router: Router = express.Router()

// GET /web/users/:id - Get single user by ID
router.get(
  '/:id',
  validateRequest({
    paramsSchema: userParamsSchema,
    responseSchema: userResponseSchema,
  }),
  async (req, res) => {
    const { id } = req.params
    const user = await getUserByIdQuery(id)

    if (!user) {
      return res.status(404).json({ error: 'User not found', message: 'User not found' })
    }

    res.json(user)
  }
)

export default router
