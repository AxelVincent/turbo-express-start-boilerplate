import { createHash } from "node:crypto"
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible"
import { logger } from "@repo/logger"
import { getRedis } from "../../config/redis"

export interface RateLimiterConfig {
  /** Short tag for logs (e.g. 'stripe', 'openai'). */
  name: string
  /** Redis key prefix (must be unique per limiter). */
  keyPrefix: string
  /** Max requests allowed per `durationSec` window. */
  points: number
  /** Window length in seconds. */
  durationSec: number
  /** Block duration when upstream returns 429 with no Retry-After hint. */
  defaultBlockMs?: number
  /** Spread retries across this many ms so concurrent waiters don't bounce on the same slot. */
  retryJitterMs?: number
}

const DEFAULT_BLOCK_MS = 30_000
const DEFAULT_JITTER_MS = 150

function describe(value: unknown): string {
  if (value instanceof Error) return value.message
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Credentials are hashed so an API key never lands in a Redis key name.
const bucketKeyCache = new Map<string, string>()
function bucketKey(credential: string): string {
  let key = bucketKeyCache.get(credential)
  if (!key) {
    key = createHash("sha256").update(credential).digest("hex").slice(0, 16)
    bucketKeyCache.set(credential, key)
  }
  return key
}

/** Reads a Retry-After header in either the seconds or HTTP-date form. */
export function parseRetryAfterMs(headers: Headers): number | undefined {
  const raw = headers.get("retry-after")
  if (!raw) return undefined
  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000
  const dateMs = Date.parse(raw)
  if (!Number.isNaN(dateMs)) {
    const diff = dateMs - Date.now()
    return diff > 0 ? diff : undefined
  }
  return undefined
}

/**
 * Throttles calls to an outbound API, shared across every process pointed at
 * the same Redis. `acquire` waits for a slot; `markBlocked` records a 429 the
 * upstream sent so other workers back off too.
 */
export function createKeyedRateLimiter(cfg: RateLimiterConfig) {
  const defaultBlockMs = cfg.defaultBlockMs ?? DEFAULT_BLOCK_MS
  const jitterMs = cfg.retryJitterMs ?? DEFAULT_JITTER_MS

  let limiter: RateLimiterRedis | null = null
  function get(): RateLimiterRedis {
    if (!limiter) {
      limiter = new RateLimiterRedis({
        storeClient: getRedis(),
        keyPrefix: cfg.keyPrefix,
        points: cfg.points,
        duration: cfg.durationSec,
        // Once a process has used its budget, short-circuit further consume()
        // calls in-memory instead of round-tripping Redis until the window resets.
        inMemoryBlockOnConsumed: cfg.points,
        inMemoryBlockDuration: cfg.durationSec,
      })
    }
    return limiter
  }

  return {
    async acquire(credential: string): Promise<void> {
      const key = bucketKey(credential)
      for (;;) {
        try {
          await get().consume(key, 1)
          return
        } catch (rej) {
          if (rej instanceof RateLimiterRes) {
            const waitMs = rej.msBeforeNext > 0 ? rej.msBeforeNext : 50
            await sleep(waitMs + Math.floor(Math.random() * jitterMs))
            continue
          }
          // Redis being down must not take the whole feature with it — degrade
          // to unthrottled rather than failing every outbound call.
          logger.warn({
            msg: `${cfg.name} rate limiter unavailable; proceeding without throttle`,
            event: `${cfg.name}.rate_limit.bypass`,
            metadata: { error: describe(rej) },
          })
          return
        }
      }
    },

    async markBlocked(
      credential: string,
      retryAfterMs?: number,
    ): Promise<void> {
      const key = bucketKey(credential)
      const blockMs =
        retryAfterMs && retryAfterMs > 0 ? retryAfterMs : defaultBlockMs
      const blockSec = Math.max(1, Math.ceil(blockMs / 1000))
      try {
        await get().block(key, blockSec)
        logger.warn({
          msg: `${cfg.name} credential blocked for ${blockSec}s after rate limit signal`,
          event: `${cfg.name}.rate_limit.blocked`,
          metadata: { blockSec, bucket: key },
        })
      } catch (err) {
        logger.warn({
          msg: `Failed to record ${cfg.name} rate limit`,
          event: `${cfg.name}.rate_limit.block_failed`,
          metadata: { error: describe(err) },
        })
      }
    },
  }
}
