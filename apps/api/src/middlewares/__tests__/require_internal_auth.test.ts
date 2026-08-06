import { describe, it, expect, jest, beforeEach, afterAll } from "@jest/globals"
import type { Request, Response } from "express"
import { requireInternalAuth } from "../require_internal_auth"

const SECRET = "internal-secret-at-least-32-characters"
const originalSecret = process.env.INTERNAL_RPC_SECRET

function invoke(header?: string) {
  const req = {
    header: (name: string) => (name === "x-internal-auth" ? header : undefined),
  } as unknown as Request

  const json = jest.fn()
  const status = jest.fn(() => ({ json })) as unknown as Response["status"]
  const res = { status, json } as unknown as Response
  const next = jest.fn()

  requireInternalAuth(req, res, next)
  return { status, json, next }
}

describe("requireInternalAuth", () => {
  beforeEach(() => {
    process.env.INTERNAL_RPC_SECRET = SECRET
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.INTERNAL_RPC_SECRET
    else process.env.INTERNAL_RPC_SECRET = originalSecret
  })

  it("passes the request through when the secret matches", () => {
    const { next, status } = invoke(SECRET)
    expect(next).toHaveBeenCalled()
    expect(status).not.toHaveBeenCalled()
  })

  it("rejects a wrong secret of the same length", () => {
    const { next, status } = invoke("x".repeat(SECRET.length))
    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(401)
  })

  it("rejects a secret of a different length without throwing", () => {
    const { next, status } = invoke("short")
    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(401)
  })

  it("rejects a missing header", () => {
    const { next, status } = invoke(undefined)
    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(401)
  })

  it("fails closed with 503 when no secret is configured", () => {
    delete process.env.INTERNAL_RPC_SECRET
    const { next, status } = invoke(SECRET)
    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(503)
  })
})
