import express, { type Router } from 'express'
import { validateRequest } from '../../../middlewares/zod_validation'
import type { UserParams } from './contract'
import { userParamsSchema } from './contract'
import { deleteUserQuery } from '@services/users/queries/delete_user'

const router: Router = express.Router()

// DELETE /web/users/:id - Delete user
router.delete(
  '/:id',
  validateRequest({
    paramsSchema: userParamsSchema,
  }),
  async (req, res) => {
    const { id } = req.params as unknown as UserParams

    const deleted = await deleteUserQuery(id)

    if (!deleted) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(204).send()
  }
)

export default router
