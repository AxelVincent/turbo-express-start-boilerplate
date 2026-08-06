import type { StorageProvider } from "./storage"
import { S3StorageProvider } from "./s3_provider"
import { LocalStorageProvider } from "./local_provider"
import { SERVER_CONFIG } from "../../config/server"

export type { StorageProvider } from "./storage"

// Default lifetime (1h) for the short-lived links handed to the UI.
export const SIGNED_URL_TTL = 60 * 60

let instance: StorageProvider | null = null

/**
 * The filesystem in development, S3 everywhere else. Constructed lazily so a
 * local run never needs S3 credentials.
 */
export function getStorage(): StorageProvider {
  if (!instance) {
    instance =
      SERVER_CONFIG.nodeEnv === "development"
        ? new LocalStorageProvider()
        : new S3StorageProvider()
  }
  return instance
}
