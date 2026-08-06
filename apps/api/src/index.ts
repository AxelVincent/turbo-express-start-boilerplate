// Must be first: the OTel SDK patches http/express/pg as they are loaded, so
// anything imported before it would go uninstrumented. `dotenv/config` is
// pulled in by this module too.
import "./tracing"
import { shutdownTracing } from "@repo/tracing"
import { createServer } from "./server"
import { logger } from "@repo/logger"
import { createDatabase, closeDatabase } from "./db/database"
import { slack } from "@external/slack/client"
import { SERVER_CONFIG } from "./config/server"

const port = process.env.PORT || 3001

// Route every logger.error to Slack outside development. Left unset in dev so
// local noise doesn't page anyone.
if (SERVER_CONFIG.nodeEnv !== "development") {
  logger.setErrorSink((entry) => {
    slack.alert({
      title: entry.msg,
      details: {
        event: entry.event,
        ...(entry.request && { requestId: entry.request.id }),
        ...entry.metadata,
      },
    })
  })
}

// How long to let in-flight requests finish before exiting anyway.
const SHUTDOWN_GRACE_MS = 5000

async function main(): Promise<void> {
  createDatabase()
  logger.info({ msg: "Database initialized", event: "database.initialized" })

  const server = createServer()
  const httpServer = server.listen(port, () => {
    logger.info({ msg: `api running on ${port}`, event: "api.running" })
  })

  let shuttingDown = false
  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return
    shuttingDown = true
    logger.info({
      msg: `Received ${signal}, shutting down`,
      event: "api.shutdown_start",
    })

    httpServer.close(() => {
      void Promise.allSettled([closeDatabase(), shutdownTracing()]).then(() => {
        logger.info({ msg: "Shutdown complete", event: "api.shutdown_done" })
        process.exit(0)
      })
    })
    // Idle keep-alive sockets would otherwise hold close() open indefinitely.
    httpServer.closeAllConnections()
    setTimeout(() => process.exit(0), SHUTDOWN_GRACE_MS).unref()
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"))
  process.on("SIGINT", () => void shutdown("SIGINT"))
}

main().catch((err) => {
  logger.error({
    msg: "Fatal error during startup",
    event: "api.startup_failed",
    metadata: {
      errorMessage: err instanceof Error ? err.message : String(err),
    },
  })
  process.exit(1)
})
