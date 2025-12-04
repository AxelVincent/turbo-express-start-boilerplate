import express, { type Router, type Request, type Response } from 'express'
import { Webhook } from 'svix'
import { logger } from '@repo/logger'
import { getDatabase } from '../db/database'
import { syncUser, deleteUser, type ClerkUserData } from '../services/user_sync'
import { CLERK_CONFIG } from 'config/clerk'

const clerkWebhookRouter: Router = express.Router()

// Webhook secret from Clerk dashboard
const WEBHOOK_SECRET = CLERK_CONFIG.API_KEYS.WEBHOOK_SECRET

if (!WEBHOOK_SECRET) {
  throw new Error('CLERK_WEBHOOK_SECRET is required')
}

interface ClerkWebhookEvent {
  type: string
  data: ClerkUserData
}

/**
 * Clerk webhook endpoint
 * Handles user.created, user.updated, and user.deleted events
 * https://clerk.com/docs/guides/development/webhooks/overview
 */
clerkWebhookRouter.post('/clerk', async (req: Request, res: Response) => {
  try {
    logger.info({
      msg: 'Webhook request received',
      event: 'webhook.clerk.request',
      metadata: {
        headers: Object.keys(req.headers),
        bodyType: typeof req.body,
        bodyLength: req.body?.length || 0,
      },
    })

    // Get the headers
    const svix_id = req.headers['svix-id'] as string
    const svix_timestamp = req.headers['svix-timestamp'] as string
    const svix_signature = req.headers['svix-signature'] as string

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      logger.error({
        msg: 'Missing svix headers',
        event: 'webhook.clerk.error',
        metadata: {
          headers: {
            'svix-id': !!svix_id,
            'svix-timestamp': !!svix_timestamp,
            'svix-signature': !!svix_signature,
          },
          allHeaders: req.headers,
        },
      })
      return res.status(400).json({
        error: 'Missing svix headers',
      })
    }

    // Get the body as a string (raw body is needed for verification)
    const payload = req.body.toString()

    // Create a new Svix instance with the webhook secret
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: ClerkWebhookEvent

    // Verify the webhook signature
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent
    } catch (err) {
      logger.error({
        msg: 'Webhook signature verification failed',
        event: 'webhook.clerk.verification.failed',
        metadata: {
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      })
      return res.status(400).json({
        error: 'Webhook signature verification failed',
      })
    }

    // Handle the webhook event
    const { type, data } = evt

    logger.info({
      msg: 'Clerk webhook received',
      event: 'webhook.clerk.received',
      metadata: {
        type,
        clerkId: data.id,
      },
    })

    const db = getDatabase()

    try {
      switch (type) {
        case 'user.created':
        case 'user.updated':
          await syncUser(db, data)
          break

        case 'user.deleted':
          await deleteUser(db, data.id)
          break

        default:
          logger.warn({
            msg: 'Unhandled webhook event type',
            event: 'webhook.clerk.unhandled',
            metadata: {
              type,
            },
          })
      }

      return res.status(200).json({
        success: true,
      })
    } catch (error) {
      logger.error({
        msg: 'Failed to process webhook event',
        event: 'webhook.clerk.processing.error',
        metadata: {
          type,
          clerkId: data.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      return res.status(500).json({
        error: 'Failed to process webhook',
      })
    }
  } catch (error) {
    logger.error({
      msg: 'Unexpected error in webhook handler',
      event: 'webhook.clerk.error',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    return res.status(500).json({
      error: 'Internal server error',
    })
  }
})

export default clerkWebhookRouter
