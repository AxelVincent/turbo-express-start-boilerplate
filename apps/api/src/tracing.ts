// Imported first from index.ts so the SDK patches http/express/pg before
// those modules are loaded. Set OTEL_SERVICE_NAME to override the name a
// product reports under.
import "dotenv/config"
import { bootstrapTracing } from "@repo/tracing"
import { SERVICE_NAME } from "./config/service"

bootstrapTracing({ serviceName: SERVICE_NAME })
