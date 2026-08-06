/**
 * @fileoverview Tests for routes-wrapped-with-logger rule.
 */

"use strict"

const { RuleTester } = require("eslint")
const rule = require("./routes-wrapped-with-logger")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
})

ruleTester.run("routes-wrapped-with-logger", rule, {
  valid: [
    // ── Already wrapped — arrow handler ──
    `router.get('/x', withLogger(async (req, res) => res.json({})))`,
    // ── Already wrapped — named handler identifier ──
    `router.post('/x', withLogger(handler))`,
    // ── Wrapped with middleware before the handler ──
    `router.post('/x', validate(schema), withLogger(handler))`,
    // ── Non-route 1-arg call — filtered by argument count ──
    `cache.get('key')`,
    // ── Property name not in HTTP method list ──
    `obj.find('/x', handler)`,
    // ── Custom wrapper name via options ──
    {
      code: `router.get('/x', loggedRoute(handler))`,
      options: [{ wrapperName: "loggedRoute" }],
    },
    // ── app.<method> form, already wrapped ──
    `app.delete('/x', withLogger(handler))`,
  ],

  invalid: [
    // ── Arrow function handler — auto-fix wraps it ──
    {
      code: `router.get('/x', async (req, res) => res.json({}))`,
      output: `router.get('/x', withLogger(async (req, res) => res.json({})))`,
      errors: [
        { messageId: "missingWrapper", data: { wrapper: "withLogger" } },
      ],
    },
    // ── Function expression handler ──
    {
      code: `router.post('/x', function handler(req, res) { res.end() })`,
      output: `router.post('/x', withLogger(function handler(req, res) { res.end() }))`,
      errors: [{ messageId: "missingWrapper" }],
    },
    // ── Identifier handler ──
    {
      code: `router.put('/x', handler)`,
      output: `router.put('/x', withLogger(handler))`,
      errors: [{ messageId: "missingWrapper" }],
    },
    // ── Handler is a different call expression (not the wrapper) ──
    {
      code: `router.delete('/x', buildHandler())`,
      output: `router.delete('/x', withLogger(buildHandler()))`,
      errors: [{ messageId: "missingWrapper" }],
    },
    // ── app.<method> form ──
    {
      code: `app.get('/x', handler)`,
      output: `app.get('/x', withLogger(handler))`,
      errors: [{ messageId: "missingWrapper" }],
    },
    // ── Multiple middlewares — only the last needs wrapping ──
    {
      code: `router.post('/x', validate(schema), handler)`,
      output: `router.post('/x', validate(schema), withLogger(handler))`,
      errors: [{ messageId: "missingWrapper" }],
    },
    // ── Custom wrapper name via options ──
    {
      code: `router.get('/x', handler)`,
      options: [{ wrapperName: "loggedRoute" }],
      output: `router.get('/x', loggedRoute(handler))`,
      errors: [
        { messageId: "missingWrapper", data: { wrapper: "loggedRoute" } },
      ],
    },
  ],
})

console.log("All tests passed!")
