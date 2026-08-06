/**
 * @fileoverview Tests for max-route-file-lines rule.
 */

"use strict"

const { RuleTester } = require("eslint")
const rule = require("./max-route-file-lines")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
})

/**
 * Generate a code string with the specified number of lines.
 */
function generateLines(count) {
  const lines = []
  for (let i = 0; i < count; i++) {
    lines.push(`const x${i} = ${i};`)
  }
  return lines.join("\n")
}

ruleTester.run("max-route-file-lines", rule, {
  valid: [
    // ── Non-route files are always ignored ──
    {
      code: generateLines(500),
      filename: "/src/components/features/big-component.tsx",
      options: [{ max: 200 }],
    },
    {
      code: generateLines(500),
      filename: "/src/lib/utils.ts",
      options: [{ max: 200 }],
    },
    // ── Route file under the limit ──
    {
      code: generateLines(50),
      filename: "/src/routes/_auth/dashboard.tsx",
      options: [{ max: 200 }],
    },
    // ── Route file exactly at the limit ──
    {
      code: generateLines(200),
      filename: "/src/routes/_auth/clients.tsx",
      options: [{ max: 200 }],
    },
    // ── Default max (200) — route file under limit ──
    {
      code: generateLines(100),
      filename: "/src/routes/index.tsx",
    },
  ],

  invalid: [
    // ── Route file exceeds max ──
    {
      code: generateLines(201),
      filename: "/src/routes/_auth/dashboard.tsx",
      options: [{ max: 200 }],
      errors: [{ messageId: "tooLong", data: { count: "201", max: "200" } }],
    },
    // ── Deeply nested route file ──
    {
      code: generateLines(300),
      filename:
        "/src/routes/_auth/orgs/$orgId/clients/$clientId/offers/$offerId/phase-2/client-ads.tsx",
      options: [{ max: 200 }],
      errors: [{ messageId: "tooLong", data: { count: "300", max: "200" } }],
    },
    // ── Default max (200) exceeded ──
    {
      code: generateLines(250),
      filename: "/src/routes/index.tsx",
      errors: [{ messageId: "tooLong", data: { count: "250", max: "200" } }],
    },
  ],
})

console.log("All tests passed!")
