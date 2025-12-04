import express, { type Router } from 'express'
import clerkWebhookRouter from './clerk'

const webhookRoutes: Router = express.Router()

// Apply raw body parsing first - needed for webhook validation
webhookRoutes.use(express.raw({ type: 'application/json' }))

// Mount Clerk webhook routes
webhookRoutes.use(clerkWebhookRouter)

export default webhookRoutes
