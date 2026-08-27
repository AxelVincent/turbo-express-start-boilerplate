import { describe, it, expect, beforeEach, afterAll } from "@jest/globals"

const KEYS = [
  "RESEND_API_KEY",
  "RESEND_INBOUND_WEBHOOK_SECRET",
  "INBOUND_ADDRESS",
  "INBOUND_FORWARD_TO",
  "INBOUND_FORWARD_FROM",
] as const

const original = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]))

const COMPLETE = {
  RESEND_API_KEY: "re_test",
  RESEND_INBOUND_WEBHOOK_SECRET: "whsec_test",
  INBOUND_ADDRESS: "contact@example.com",
  INBOUND_FORWARD_TO: "team@example.com",
  INBOUND_FORWARD_FROM: "forward@example.com",
}

function setEnv(values: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const key of KEYS) {
    if (values[key] === undefined) delete process.env[key]
    else process.env[key] = values[key]
  }
}

// The module reads process.env at import time, so each case needs a fresh one.
async function loadConfig() {
  let mod!: typeof import("../resend")
  await jest.isolateModulesAsync(async () => {
    mod = await import("../resend")
  })
  return mod.getInboundEmailConfig()
}

describe("getInboundEmailConfig", () => {
  beforeEach(() => {
    setEnv({})
  })

  afterAll(() => {
    for (const key of KEYS) {
      const value = original[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  it("returns null when nothing is configured", async () => {
    expect(await loadConfig()).toBeNull()
  })

  it("returns the config when every required var is set", async () => {
    setEnv(COMPLETE)
    expect(await loadConfig()).toEqual({
      webhookSecret: "whsec_test",
      address: "contact@example.com",
      forwardTo: "team@example.com",
      forwardFrom: "forward@example.com",
    })
  })

  // Half-configured must not half-work: forwarding without a `from` bounces,
  // without the address filter every catch-all message gets forwarded, and
  // without the API key `new Resend()` throws before the signature is checked.
  it.each(KEYS)("returns null when %s is missing", async (missing) => {
    const partial = { ...COMPLETE }
    delete (partial as Record<string, string>)[missing]
    setEnv(partial)
    expect(await loadConfig()).toBeNull()
  })
})
