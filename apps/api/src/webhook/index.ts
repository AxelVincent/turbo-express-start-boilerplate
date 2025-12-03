import express, { type Router } from 'express'

const webhookRoutes: Router = express.Router()

// Apply raw body parsing first - needed for webhook validation
webhookRoutes.use(express.raw({ type: 'application/json' }))

export default webhookRoutes
