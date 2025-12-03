import express, { type Router } from 'express'
import type { HelloResponse } from '../contracts/web'
import usersRouter from './users'

const router: Router = express.Router()

router.get('/', (req, res) => {
  const response: HelloResponse = 'Hello World'
  res.send(response)
})

// Mount users router
router.use('/users', usersRouter)

export default router