import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner"
import { logger } from "@repo/logger"
import { requireS3Config } from "../../config/storage"
import type { StorageProvider } from "./index"

const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60
// GET presigns are pinned to a coarse time bucket so re-signing the same key
// within the window yields a byte-identical URL — without this every response
// carries a fresh URL and the browser re-downloads images it already has.
const SIGNING_BUCKET_SECONDS = 6 * 60 * 60

function isNotFound(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } }
  return e?.name === "NotFound" || e?.$metadata?.httpStatusCode === 404
}

/** S3 errors carry their useful detail on non-enumerable fields. */
function describeS3Error(err: unknown): Record<string, unknown> {
  const e = err as {
    name?: string
    message?: string
    Code?: string
    $fault?: string
    $metadata?: { httpStatusCode?: number; requestId?: string }
  }
  return {
    name: e?.name,
    message: e?.message,
    code: e?.Code,
    fault: e?.$fault,
    httpStatusCode: e?.$metadata?.httpStatusCode,
    requestId: e?.$metadata?.requestId,
  }
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client
  private bucket: string

  constructor() {
    const config = requireS3Config()
    this.bucket = config.bucket

    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // Most S3-compatible stores (MinIO, Railway, R2) need path-style URLs.
      forcePathStyle: true,
    })

    logger.debug({
      msg: "S3 storage initialized",
      event: "storage.s3.init",
      metadata: {
        endpoint: config.endpoint,
        bucket: config.bucket,
        region: config.region,
      },
    })
  }

  async upload(
    key: string,
    data: Buffer,
    contentType: string,
    contentDisposition?: string,
  ): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: data,
          ContentType: contentType,
          ContentDisposition: contentDisposition,
        }),
      )
    } catch (err) {
      logger.error({
        msg: "S3 upload failed",
        event: "storage.s3.upload_failed",
        metadata: {
          bucket: this.bucket,
          key,
          byteLength: data.length,
          ...describeS3Error(err),
        },
      })
      throw err
    }
  }

  async get(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    )
    const stream = response.Body as {
      transformToByteArray: () => Promise<Uint8Array>
    }
    return Buffer.from(await stream.transformToByteArray())
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      )
      return true
    } catch (err: unknown) {
      if (isNotFound(err)) return false
      throw err
    }
  }

  async getSignedUrl(
    key: string,
    expiresInSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS,
  ): Promise<string> {
    const bucketStartMs =
      Math.floor(Date.now() / (SIGNING_BUCKET_SECONDS * 1000)) *
      SIGNING_BUCKET_SECONDS *
      1000
    return awsGetSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseCacheControl: `private, max-age=${SIGNING_BUCKET_SECONDS}, immutable`,
      }),
      {
        // Expiry counts from the bucket start, so pad it to guarantee at least
        // the requested TTL for a caller signing at the end of the bucket.
        expiresIn: SIGNING_BUCKET_SECONDS + expiresInSeconds,
        signingDate: new Date(bucketStartMs),
      },
    )
  }

  async getSignedPutUrl(
    key: string,
    contentType: string,
    expiresInSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS,
  ): Promise<string> {
    return awsGetSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: expiresInSeconds },
    )
  }

  async headSize(key: string): Promise<number | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      )
      return typeof head.ContentLength === "number" ? head.ContentLength : null
    } catch (err: unknown) {
      if (isNotFound(err)) return null
      throw err
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    )
  }
}
