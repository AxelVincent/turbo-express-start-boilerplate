import { S3StorageProvider } from "./s3_provider"
import { LocalStorageProvider } from "./local_provider"
import { SERVER_CONFIG } from "../../config/server"

// Default lifetime (1h) for the short-lived links handed to the UI.
export const SIGNED_URL_TTL = 60 * 60

let instance: StorageProvider | null = null

export interface StorageProvider {
  upload(
    key: string,
    data: Buffer,
    contentType: string,
    contentDisposition?: string,
  ): Promise<void>
  get(key: string): Promise<Buffer>
  exists(key: string): Promise<boolean>
  /** Time-limited GET URL, safe to hand to a browser or another service. */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>
  /** Time-limited PUT URL, for uploading straight from the client. */
  getSignedPutUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<string>
  /** Size in bytes, or null when the object doesn't exist. */
  headSize(key: string): Promise<number | null>
  delete(key: string): Promise<void>
}

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
