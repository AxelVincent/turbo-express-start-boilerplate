import { NodeSDK } from "@opentelemetry/sdk-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"

export interface BootstrapOptions {
  serviceName: string
}

let sdk: NodeSDK | null = null

/**
 * Starts the OpenTelemetry SDK. Must run before anything it instruments is
 * imported, so the entrypoint should import the module that calls this on its
 * very first line.
 */
export function bootstrapTracing(opts: BootstrapOptions): void {
  if (sdk) return

  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318"

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? opts.serviceName,
    }),
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    instrumentations: [
      // Everything this stack doesn't use stays off — each enabled
      // instrumentation patches its module on load and costs startup time.
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-net": { enabled: false },
        "@opentelemetry/instrumentation-dns": { enabled: false },
        "@opentelemetry/instrumentation-koa": { enabled: false },
        "@opentelemetry/instrumentation-hapi": { enabled: false },
        "@opentelemetry/instrumentation-restify": { enabled: false },
        "@opentelemetry/instrumentation-connect": { enabled: false },
        "@opentelemetry/instrumentation-router": { enabled: false },
        "@opentelemetry/instrumentation-graphql": { enabled: false },
        "@opentelemetry/instrumentation-grpc": { enabled: false },
        "@opentelemetry/instrumentation-nestjs-core": { enabled: false },
        "@opentelemetry/instrumentation-mongodb": { enabled: false },
        "@opentelemetry/instrumentation-mongoose": { enabled: false },
        "@opentelemetry/instrumentation-mysql": { enabled: false },
        "@opentelemetry/instrumentation-mysql2": { enabled: false },
        "@opentelemetry/instrumentation-oracledb": { enabled: false },
        "@opentelemetry/instrumentation-tedious": { enabled: false },
        "@opentelemetry/instrumentation-cassandra-driver": { enabled: false },
        "@opentelemetry/instrumentation-memcached": { enabled: false },
        "@opentelemetry/instrumentation-knex": { enabled: false },
        "@opentelemetry/instrumentation-kafkajs": { enabled: false },
        "@opentelemetry/instrumentation-amqplib": { enabled: false },
        "@opentelemetry/instrumentation-aws-lambda": { enabled: false },
        "@opentelemetry/instrumentation-cucumber": { enabled: false },
        "@opentelemetry/instrumentation-bunyan": { enabled: false },
        "@opentelemetry/instrumentation-winston": { enabled: false },
        "@opentelemetry/instrumentation-socket.io": { enabled: false },
      }),
    ],
  })

  sdk.start()
}

/** Flushes pending spans. Call during graceful shutdown. */
export function shutdownTracing(): Promise<void> {
  return sdk ? sdk.shutdown() : Promise.resolve()
}
