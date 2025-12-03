import express, { type Request, type Response, type Router } from 'express'
import { validateRequest } from '../../../middlewares/zod_validation'
import type { CreateUserInput, User } from './contract'
import { createUserSchema, userSchema } from './contract'
import { createUserQuery } from '@services/users/queries/create_user'

const router: Router = express.Router()

// POST /web/users - Create new user
router.post(
  '/',
  validateRequest({
    bodySchema: createUserSchema,
    responseSchema: userSchema,
  }),
  async (req: Request, res: Response) => {
    const input = req.body as CreateUserInput

    const newUser = await createUserQuery(input)

    res.status(201).json(newUser as User)
  }
)

export default router
