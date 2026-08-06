import supertest from "supertest"
import { describe, it, expect, jest } from "@jest/globals"

// better-auth ships `./node` as ESM only, which jest's CJS runtime can't load.
// The handler is irrelevant to what these tests assert — they cover the app's
// own wiring — so stub it out along with the auth instance it wraps.
jest.mock("better-auth/node", () => ({
  toNodeHandler: () => (_req: unknown, res: { end: () => void }) => res.end(),
  fromNodeHeaders: () => new Headers(),
}))
// getSession must exist and resolve — betterAuthMiddleware calls it on every
// request, and a bare {} sends it down its error path on each one.
jest.mock("../auth/auth", () => ({
  auth: { api: { getSession: async () => null } },
}))

import { createServer } from "../server"

describe("server", () => {
  it("health check returns ok", async () => {
    await supertest(createServer())
      .get("/health")
      .expect(200)
      .then((res) => {
        expect(res.body.status).toBe("ok")
      })
  })

  it("does not advertise the express fingerprint", async () => {
    await supertest(createServer())
      .get("/health")
      .expect(200)
      .then((res) => {
        expect(res.headers["x-powered-by"]).toBeUndefined()
      })
  })

  it("returns 404 for an unknown route", async () => {
    await supertest(createServer()).get("/does-not-exist").expect(404)
  })
})
