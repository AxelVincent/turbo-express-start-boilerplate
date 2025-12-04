import { type DB } from '../db/types'
import { type Kysely } from 'kysely'
import { logger } from '@repo/logger'

export interface ClerkUserData {
  id: string
  email_addresses: Array<{
    email_address: string
    id: string
  }>
  first_name: string | null
  last_name: string | null
}

/**
 * Create or update user from Clerk webhook data
 */
export async function syncUser(
  db: Kysely<DB>,
  clerkUser: ClerkUserData
): Promise<void> {
  const primaryEmail = clerkUser.email_addresses[0]?.email_address

  if (!primaryEmail) {
    logger.error({
      msg: 'No email found for Clerk user',
      event: 'webhook.user.sync.error',
      metadata: {
        clerkId: clerkUser.id,
      },
    })
    throw new Error('No email found for user')
  }

  const name = [clerkUser.first_name, clerkUser.last_name]
    .filter(Boolean)
    .join(' ') || primaryEmail.split('@')[0]

  try {
    // Check if user exists by clerk_id
    const existingUser = await db
      .selectFrom('users')
      .selectAll()
      .where('clerk_id', '=', clerkUser.id)
      .executeTakeFirst()

    if (existingUser) {
      // Update existing user
      await db
        .updateTable('users')
        .set({
          email: primaryEmail,
          name: name,
          updated_at: new Date(),
        })
        .where('clerk_id', '=', clerkUser.id)
        .execute()

      logger.info({
        msg: 'User updated from Clerk webhook',
        event: 'webhook.user.updated',
        metadata: {
          userId: existingUser.id,
          clerkId: clerkUser.id,
          email: primaryEmail,
        },
      })
    } else {
      // Create new user
      const newUser = await db
        .insertInto('users')
        .values({
          clerk_id: clerkUser.id,
          email: primaryEmail,
          name: name,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      logger.info({
        msg: 'User created from Clerk webhook',
        event: 'webhook.user.created',
        metadata: {
          userId: newUser.id,
          clerkId: clerkUser.id,
          email: primaryEmail,
        },
      })
    }
  } catch (error) {
    logger.error({
      msg: 'Failed to sync user from Clerk',
      event: 'webhook.user.sync.error',
      metadata: {
        clerkId: clerkUser.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    throw error
  }
}

/**
 * Delete user by Clerk ID
 */
export async function deleteUser(
  db: Kysely<DB>,
  clerkId: string
): Promise<void> {
  try {
    const result = await db
      .deleteFrom('users')
      .where('clerk_id', '=', clerkId)
      .executeTakeFirst()

    if (result.numDeletedRows === BigInt(0)) {
      logger.warn({
        msg: 'User not found for deletion',
        event: 'webhook.user.delete.notfound',
        metadata: {
          clerkId,
        },
      })
    } else {
      logger.info({
        msg: 'User deleted from Clerk webhook',
        event: 'webhook.user.deleted',
        metadata: {
          clerkId,
        },
      })
    }
  } catch (error) {
    logger.error({
      msg: 'Failed to delete user from Clerk',
      event: 'webhook.user.delete.error',
      metadata: {
        clerkId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    throw error
  }
}
