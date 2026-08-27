import { mkdir, writeFile, unlink, readFile, stat } from "node:fs/promises"
import { dirname, join, resolve, sep } from "node:path"
import type { StorageProvider } from "./index"

/**
 * Filesystem-backed provider for local development. Files live under
 * ./uploads and are served by the static mount in server.ts, so the URLs it
 * returns work in a browser exactly like the S3 signed ones.
 */
export class LocalStorageProvider implements StorageProvider {
  private basePath: string
  private baseUrl: string

  constructor() {
    const port = process.env.PORT ?? "3030"
    this.basePath = join(process.cwd(), "uploads")
    this.baseUrl = `http://localhost:${port}/uploads`
  }

  /** Keeps a key like `../../etc/passwd` from escaping the uploads dir. */
  private resolveKey(key: string): string {
    const filePath = resolve(this.basePath, key)
    if (
      filePath !== this.basePath &&
      !filePath.startsWith(this.basePath + sep)
    ) {
      throw new Error(`Storage key escapes the uploads directory: ${key}`)
    }
    return filePath
  }

  async upload(key: string, data: Buffer): Promise<void> {
    const filePath = this.resolveKey(key)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, data)
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolveKey(key))
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.resolveKey(key))
      return true
    } catch {
      return false
    }
  }

  async getSignedUrl(key: string): Promise<string> {
    return `${this.baseUrl}/${key}`
  }

  async getSignedPutUrl(): Promise<string> {
    throw new Error(
      "LocalStorageProvider does not support presigned PUT URLs. Configure S3 to use the direct-upload path.",
    )
  }

  async headSize(key: string): Promise<number | null> {
    try {
      const info = await stat(this.resolveKey(key))
      return info.size
    } catch {
      return null
    }
  }

  async delete(key: string): Promise<void> {
    await unlink(this.resolveKey(key))
  }
}
