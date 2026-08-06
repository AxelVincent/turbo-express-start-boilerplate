import { json, urlencoded } from "body-parser"
import express, { type Express } from "express"
import { join } from "node:path"
import cors from "cors"
import { toNodeHandler } from "better-auth/node"
import { httpMetricsMiddleware } from "./middlewares/http_metrics"
import { createMetricsHandler } from "@repo/metrics"
import { betterAuthMiddleware } from "./middlewares/better_auth_middleware"
import { metricsRegistry } from "./metrics/registry"
import routesWeb from "./routes_web"
import routesPublic from "./routes_public"
import routesWebhook from "./routes_webhook"
import routesInternal from "./routes_internal"
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
        // Lets the browser read the download filename off a file response.
        exposedHeaders: ["Content-Disposition"],
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
    .use(
      json({
        limit: "10mb",
        // Keep the exact bytes as received so webhook signatures can be
        // verified against them — a re-serialized body differs in key order
        // and whitespace, and would fail an otherwise valid signature.
        verify: (req, _res, buf) => {
          ;(req as express.Request).rawBody = buf
        },
      }),
    )
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
    // Unauthenticated public API
    .use("/public", routesPublic)
    // Inbound webhooks — each route verifies its own provider signature
    .use("/webhook", routesWebhook)
    // Authenticated user routes
    .use("/web", routesWeb)
    // Service-to-service, behind INTERNAL_RPC_SECRET
    .use("/internal", routesInternal)

  // Dev/test-only surfaces: local media served from disk by
  // LocalStorageProvider, plus the integration-test routes.
  if (isTestEnvironment()) {
    app.use("/uploads", express.static(join(process.cwd(), "uploads")))
    const { testsAuther } = require("./middlewares/tests_auther")
    const { testTracker } = require("./middlewares/test_tracker")
    const testRoutes = require("./routes_tests").default
    app.use("/apitests", testsAuther, testTracker, testRoutes)
  }

  return app
}
