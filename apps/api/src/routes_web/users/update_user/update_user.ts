import express, { type Router } from 'express'
import { validateRequest } from '../../../middlewares/zod_validation'
import type { UpdateUserInput, User, UserParams } from './contract'
import { updateUserSchema, userParamsSchema, userSchema } from './contract'
import { updateUserQuery } from '@services/users/queries/update_user'

const router: Router = express.Router()

// PATCH /web/users/:id - Update user
router.patch(
  '/:id',
  validateRequest({
    paramsSchema: userParamsSchema,
    bodySchema: updateUserSchema,
    responseSchema: userSchema,
  }),
  async (req, res) => {
    const { id } = req.params as unknown as UserParams
    const input = req.body as UpdateUserInput

    const updatedUser = await updateUserQuery(id, input)

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found', message: 'User not found' })
    }

    res.json(updatedUser as User)
  }
)

export default router
