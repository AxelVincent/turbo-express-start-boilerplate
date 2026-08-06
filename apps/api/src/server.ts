import { json, urlencoded } from "body-parser"
import express, { type Express } from "express"
import cors from "cors"
import { toNodeHandler } from "better-auth/node"
import { httpMetricsMiddleware } from "./middlewares/http_metrics"
import { createMetricsHandler } from "@repo/metrics"
import { betterAuthMiddleware } from "./middlewares/better_auth_middleware"
import { metricsRegistry } from "./metrics/registry"
import routesWeb from "./routes_web"
import { auth } from "./auth/auth"
import { BETTER_AUTH_CONFIG } from "./config/better_auth"

const isTestEnvironment = () =>
  ["development", "test", "local"].includes(
    process.env.NODE_ENV || "development",
  )

export const createServer = (): Express => {
  const app = express()

  // Trust first proxy for correct client IP detection
  app.set("trust proxy", 1)

  app
    .disable("x-powered-by")
    // CORS — credentials: true is required for cookie-based auth
    .use(
      cors({
        origin: BETTER_AUTH_CONFIG.trustedOrigins,
        credentials: true,
      }),
    )
    // Better Auth API routes — must be before body parsing
    // Rewrite /auth/* to /api/auth/* so BetterAuth's default basePath works
    // even if a reverse proxy strips the /api prefix
    .all("/auth/*", (req, res) => {
      req.url = `/api${req.url}`
      return (toNodeHandler(auth) as any)(req, res)
    })
    .all("/api/auth/*", toNodeHandler(auth) as any)
    // Body parsing for all other routes
    .use(urlencoded({ extended: true, limit: "10mb" }))
    .use(json({ limit: "10mb" }))
    .use(httpMetricsMiddleware)
    // Better Auth session middleware — extracts session, populates req.auth
    .use(betterAuthMiddleware)
    // Public routes
    .get(
      "/metrics",
      createMetricsHandler(metricsRegistry, {
        username: process.env.METRICS_USERNAME,
        password: process.env.METRICS_PASSWORD,
      }),
    )
    .get("/health", (_, res) => {
      return res.json({ status: "ok" })
    })
    // Protected routes
    .use("/web", routesWeb)

  // Test routes — only available in development/test environments
  if (isTestEnvironment()) {
    const { testsAuther } = require("./middlewares/tests_auther")
    const { testTracker } = require("./middlewares/test_tracker")
    const testRoutes = require("./routes_tests").default
    app.use("/apitests", testsAuther, testTracker, testRoutes)
  }

  return app
}
