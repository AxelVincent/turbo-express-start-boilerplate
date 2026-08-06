import { describe, it, expect } from "@jest/globals"
import { encodeCursor, decodeCursor } from "../cursor"

describe("cursor", () => {
  it("round-trips a payload", () => {
    const payload = { id: "abc", createdAt: "2026-01-01T00:00:00.000Z" }
    expect(decodeCursor(encodeCursor(payload))).toEqual(payload)
  })

  it("produces a URL-safe string", () => {
    // base64url must not emit +, / or = — all of which need escaping in a query
    // string and would come back corrupted.
    const cursor = encodeCursor({ v: "??????>>>>>>~~~~~" })
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeCursor<{ v: string }>(cursor)?.v).toBe("??????>>>>>>~~~~~")
  })

  it("returns null for a malformed cursor instead of throwing", () => {
    expect(decodeCursor("not-a-cursor")).toBeNull()
  })

  it("returns null for valid base64 that isn't JSON", () => {
    expect(decodeCursor(Buffer.from("hello").toString("base64url"))).toBeNull()
  })

  it("preserves nested values and unicode", () => {
    const payload = { page: { after: "café ☕" }, n: 42 }
    expect(decodeCursor(encodeCursor(payload))).toEqual(payload)
  })
})
