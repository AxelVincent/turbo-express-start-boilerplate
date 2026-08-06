"use strict"

const { RuleTester } = require("eslint")
const rule = require("./routes-must-use-contract")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
})

const ROUTE_FILE = "/repo/apps/api/src/routes_web/org/foo/bar/bar.ts"
const AGGREGATOR_FILE = "/repo/apps/api/src/routes_web/org/foo/index.ts"
const CONTRACT_FILE = "/repo/apps/api/src/routes_web/org/foo/bar/contract.ts"
const NON_ROUTE_FILE = "/repo/apps/api/src/services/foo.ts"
const TEST_HARNESS_FILE = "/repo/apps/api/src/routes_tests/index.ts"

ruleTester.run("routes-must-use-contract", rule, {
  valid: [
    // ── Canonical: validateRequest with schemas imported from ./contract ──
    {
      filename: ROUTE_FILE,
      code: `
        import { paramsSchema, bodySchema, responseSchema } from './contract'
        router.post('/:id', validateRequest({ paramsSchema, bodySchema, responseSchema }), handler)
      `,
    },
    // ── Subpath import like '../shared/contract' ──
    {
      filename: ROUTE_FILE,
      code: `
        import { paramsSchema } from '../shared/contract'
        router.get('/:id', validateRequest({ paramsSchema }), handler)
      `,
    },
    // ── Multiple routes in one file, all valid ──
    {
      filename: ROUTE_FILE,
      code: `
        import { listSchema, createSchema, getSchema } from './contract'
        router.get('/', validateRequest({ responseSchema: listSchema }), h1)
        router.post('/', validateRequest({ bodySchema: createSchema }), h2)
        router.get('/:id', validateRequest({ paramsSchema: getSchema }), h3)
      `,
    },
    // ── Aggregator file using router.use is fine ──
    {
      filename: AGGREGATOR_FILE,
      code: `
        import sub from './bar/bar'
        router.use('/bar', sub)
      `,
    },
    // ── contract.ts itself is exempt ──
    {
      filename: CONTRACT_FILE,
      code: `
        import { z } from 'zod'
        export const fooSchema = z.object({ id: z.string() })
      `,
    },
    // ── Files outside routes_web are not checked ──
    {
      filename: NON_ROUTE_FILE,
      code: `
        const localSchema = z.object({ id: z.string() })
        router.get('/', validateRequest({ paramsSchema: localSchema }), handler)
      `,
    },
    // ── routes_tests/ test harness is exempt ──
    {
      filename: TEST_HARNESS_FILE,
      code: `
        router.post('/seed_users', async (req, res) => res.json({ ok: true }))
      `,
    },
  ],

  invalid: [
    // ── router.get without validateRequest ──
    {
      filename: ROUTE_FILE,
      code: `
        router.get('/', async (req, res) => res.json({}))
      `,
      errors: [{ messageId: "missingValidate", data: { method: "get" } }],
    },
    // ── inline z.object in validateRequest ──
    {
      filename: ROUTE_FILE,
      code: `
        import { z } from 'zod'
        router.post(
          '/',
          validateRequest({ bodySchema: z.object({ name: z.string() }) }),
          handler,
        )
      `,
      errors: [{ messageId: "inlineSchema", data: { key: "bodySchema" } }],
    },
    // ── Local const schema (not imported) ──
    {
      filename: ROUTE_FILE,
      code: `
        import { z } from 'zod'
        const paramsSchema = z.object({ id: z.string() })
        router.get('/:id', validateRequest({ paramsSchema }), handler)
      `,
      errors: [
        {
          messageId: "schemaNotFromContract",
          data: { key: "paramsSchema", name: "paramsSchema" },
        },
      ],
    },
    // ── Schema imported from a non-contract module ──
    {
      filename: ROUTE_FILE,
      code: `
        import { paramsSchema } from './schemas'
        router.get('/:id', validateRequest({ paramsSchema }), handler)
      `,
      errors: [
        {
          messageId: "schemaNotFromContract",
          data: { key: "paramsSchema", name: "paramsSchema" },
        },
      ],
    },
    // ── Mix: one route OK, another missing validateRequest ──
    {
      filename: ROUTE_FILE,
      code: `
        import { schemaA } from './contract'
        router.get('/a', validateRequest({ responseSchema: schemaA }), h1)
        router.get('/b', h2)
      `,
      errors: [{ messageId: "missingValidate", data: { method: "get" } }],
    },
  ],
})

console.log("routes-must-use-contract: all tests passed")
