import { logger } from "@repo/logger"
import { closeRedis } from "../config/redis"

/**
 * Background job lifecycle, called from the entrypoint. Register BullMQ queues
 * and workers in startQueues, and close them in stopQueues before the Redis
 * connection goes — a worker still holding a blocking command will otherwise
 * keep the process alive past shutdown.
 */
export async function startQueues(): Promise<void> {
  logger.info({ msg: "Queues started", event: "queues.started" })
}

export async function stopQueues(): Promise<void> {
  await closeRedis()
  logger.info({ msg: "Queues stopped", event: "queues.stopped" })
}
