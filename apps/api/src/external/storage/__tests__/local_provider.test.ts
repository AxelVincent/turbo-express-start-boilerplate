import { describe, it, expect, afterAll } from "@jest/globals"
import { rm, readFile } from "node:fs/promises"
import { join } from "node:path"
import { LocalStorageProvider } from "../local_provider"

const provider = new LocalStorageProvider()
const uploadsDir = join(process.cwd(), "uploads")

afterAll(async () => {
  await rm(join(uploadsDir, "__test__"), { recursive: true, force: true })
})

describe("LocalStorageProvider", () => {
  it("round-trips a file through upload and get", async () => {
    await provider.upload("__test__/a.txt", Buffer.from("hello"), "text/plain")
    expect((await provider.get("__test__/a.txt")).toString()).toBe("hello")
  })

  it("creates intermediate directories", async () => {
    await provider.upload(
      "__test__/deep/nested/b.txt",
      Buffer.from("x"),
      "text/plain",
    )
    const onDisk = await readFile(
      join(uploadsDir, "__test__/deep/nested/b.txt"),
    )
    expect(onDisk.toString()).toBe("x")
  })

  it("reports existence and size without reading the whole file", async () => {
    await provider.upload(
      "__test__/c.bin",
      Buffer.alloc(1024),
      "application/octet-stream",
    )
    expect(await provider.exists("__test__/c.bin")).toBe(true)
    expect(await provider.headSize("__test__/c.bin")).toBe(1024)
  })

  it("reports a missing object as absent rather than throwing", async () => {
    expect(await provider.exists("__test__/nope.txt")).toBe(false)
    expect(await provider.headSize("__test__/nope.txt")).toBeNull()
  })

  it("deletes a file", async () => {
    await provider.upload("__test__/d.txt", Buffer.from("bye"), "text/plain")
    await provider.delete("__test__/d.txt")
    expect(await provider.exists("__test__/d.txt")).toBe(false)
  })

  it("refuses a key that escapes the uploads directory", async () => {
    await expect(
      provider.upload("../escaped.txt", Buffer.from("nope"), "text/plain"),
    ).rejects.toThrow(/escapes the uploads directory/)
    await expect(provider.get("../../etc/passwd")).rejects.toThrow(
      /escapes the uploads directory/,
    )
  })

  it("rejects presigned PUT URLs, which only S3 supports", async () => {
    await expect(provider.getSignedPutUrl()).rejects.toThrow(
      /does not support presigned PUT/,
    )
  })
})
