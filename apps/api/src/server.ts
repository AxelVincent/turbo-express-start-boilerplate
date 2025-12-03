import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import { httpMetricsMiddleware } from "./middlewares/http_metrics";
import { createMetricsHandler } from "@repo/metrics";
import { pinoMiddleware } from "./middlewares/pino_middleware";
import { metricsRegistry } from "./metrics/registry";
import routesWeb from "./routes_web";
import routesWebhook from "./webhook";

export const createServer = (): Express => {
  const app = express();

  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(urlencoded({ extended: true, limit: "10mb" }))
    .use(json({ limit: "10mb" }))
    .use(cors())
    .use(httpMetricsMiddleware)
    .use(pinoMiddleware)
    .get("/metrics", createMetricsHandler(metricsRegistry, {
      username: process.env.METRICS_USERNAME,
      password: process.env.METRICS_PASSWORD,
    }))
    .get("/health", (_, res) => {
      return res.json({ status: "ok" });
    })
    .use("/web", routesWeb)
    .use('/webhook', routesWebhook)

  return app;
};
