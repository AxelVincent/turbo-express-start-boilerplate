/**
 * Storage provider abstraction. Swap the backing store by changing what
 * `getStorage()` returns — callers only ever see this interface.
 */

/* eslint-disable no-unused-vars */
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
