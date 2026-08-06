"use strict"

const fs = require("fs")
const os = require("os")
const path = require("path")
const { RuleTester } = require("eslint")
const rule = require("./one-route-per-file")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
})

// ── Build a real on-disk fixture so the missingContract check (which uses
//    fs.existsSync) has something to inspect. ─────────────────────────────
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "one-route-per-file-"))
const ROUTES_WEB = path.join(TMP_ROOT, "apps/api/src/routes_web")

function write(rel, content = "") {
  const abs = path.join(ROUTES_WEB, rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content)
  return abs
}

// list/ — fully self-contained: list.ts + contract.ts + queries/
const HANDLER_FILE = write("admin/agents/list/list.ts")
write("admin/agents/list/contract.ts", "export const x = {}")
write("admin/agents/list/queries/get_things.ts", "export function q() {}")

// compare/ — for filename-must-match-folder happy path
const ROUTE_HANDLER_PARENT_MATCH = write("admin/agents/compare/compare.ts")
write("admin/agents/compare/contract.ts", "export const x = {}")

// stats/ — has contract too, used by the compound-failure case below
write("admin/agents/stats/stats.ts")
write("admin/agents/stats/contract.ts", "export const x = {}")

// nocontract/ — handler folder deliberately missing contract.ts
const NO_CONTRACT_FILE = write("admin/agents/nocontract/nocontract.ts")

// flat handler at admin/agents/list.ts (siblings already exist via stats/list)
const FLAT_HANDLER_FILE = write("admin/agents/list.ts")

// Multi-handler file under admin/agents/agents/agents.ts (with contract so the
// missingContract check doesn't also fire and pollute the assertion)
const MULTI_HANDLER_FILE = write("admin/agents/agents/agents.ts")
write("admin/agents/agents/contract.ts", "export const x = {}")

const INDEX_FILE = write("admin/agents/index.ts")
const ROOT_INDEX_FILE = write("index.ts")
const CONTRACT_FILE = path.join(ROUTES_WEB, "admin/agents/list/contract.ts")

// Parent-level contract.ts in a delegator folder. `admin/shared/` has a single
// sub-route `foo/foo.ts`, so its `contract.ts` is shared across sub-routes and
// must be flagged.
write("admin/shared/foo/foo.ts")
write("admin/shared/foo/contract.ts")
const SHARED_CONTRACT_FILE = write(
  "admin/shared/contract.ts",
  "export const shared = {}",
)
const QUERY_FILE = path.join(
  ROUTES_WEB,
  "admin/agents/list/queries/get_things.ts",
)
const NON_ROUTE_FILE = path.join(TMP_ROOT, "apps/api/src/services/foo.ts")
fs.mkdirSync(path.dirname(NON_ROUTE_FILE), { recursive: true })
fs.writeFileSync(NON_ROUTE_FILE, "")

ruleTester.run("one-route-per-file", rule, {
  valid: [
    // ── Canonical: <folder>/<folder>.ts with one handler, contract sibling ──
    {
      filename: HANDLER_FILE,
      code: `
        router.get('/', validateRequest({}), async (req, res) => res.json({}))
      `,
    },
    {
      filename: ROUTE_HANDLER_PARENT_MATCH,
      code: `
        router.post('/:agentId/compare', validateRequest({}), handler)
      `,
    },
    // ── Sibling './queries/' import is allowed ──────────────────────────
    {
      filename: HANDLER_FILE,
      code: `
        import { getThings } from './queries/get_things'
        router.get('/', validateRequest({}), handler)
      `,
    },
    // ── Imports from non-relative '/queries/' paths (e.g. @services) are
    //    out of scope ───────────────────────────────────────────────────
    {
      filename: HANDLER_FILE,
      code: `
        import { getThings } from '@services/foo/queries/bar'
        router.get('/', validateRequest({}), handler)
      `,
    },
    // ── index.ts: only router.use(...) is allowed; no contract required ──
    {
      filename: INDEX_FILE,
      code: `
        import listRouter from './list/list'
        import statsRouter from './stats/stats'
        router.use('/', listRouter)
        router.use('/', statsRouter)
      `,
    },
    {
      filename: ROOT_INDEX_FILE,
      code: `
        router.use(requireAuth)
        router.use('/admin', adminRouter)
        router.use(orgRouter)
      `,
    },
    // ── contract.ts in a leaf route folder is allowed ───────────────────
    {
      filename: CONTRACT_FILE,
      code: `
        export const listSchema = {}
      `,
    },
    // ── queries/ are exempt ─────────────────────────────────────────────
    {
      filename: QUERY_FILE,
      code: `
        export async function getThings() { return [] }
      `,
    },
    // ── Files outside routes_web are not checked ────────────────────────
    {
      filename: NON_ROUTE_FILE,
      code: `
        router.get('/a', h1)
        router.post('/b', h2)
      `,
    },
    // ── Non-route helper inside routes_web (no router.<method> calls) is
    //    not subject to missingContract either ─────────────────────────
    {
      filename: path.join(ROUTES_WEB, "admin/agents/list/helpers.ts"),
      code: `
        export function buildResponse() { return {} }
      `,
    },
  ],

  invalid: [
    // ── tooManyRoutes: two handlers in one non-index file ───────────────
    {
      filename: MULTI_HANDLER_FILE,
      code: `
        router.get('/', h1)
        router.post('/', h2)
      `,
      errors: [{ messageId: "tooManyRoutes", data: { count: "2" } }],
    },
    // ── tooManyRoutes: three handlers, reported once ────────────────────
    {
      filename: MULTI_HANDLER_FILE,
      code: `
        router.get('/', h1)
        router.get('/versions', h2)
        router.post('/generate', h3)
      `,
      errors: [{ messageId: "tooManyRoutes", data: { count: "3" } }],
    },
    // ── handlerInIndex: a handler in index.ts ───────────────────────────
    {
      filename: INDEX_FILE,
      code: `
        router.get('/', validateRequest({}), handler)
      `,
      errors: [{ messageId: "handlerInIndex", data: { method: "get" } }],
    },
    // ── handlerInIndex: each handler in index.ts is reported ────────────
    {
      filename: INDEX_FILE,
      code: `
        router.get('/', h1)
        router.post('/generate', h2)
      `,
      errors: [
        { messageId: "handlerInIndex", data: { method: "get" } },
        { messageId: "handlerInIndex", data: { method: "post" } },
      ],
    },
    // ── filenameMustMatchFolder: flat list.ts in agents/ folder.
    //    Note: agents/ has no contract.ts so missingContract also fires.
    {
      filename: FLAT_HANDLER_FILE,
      code: `
        router.get('/', validateRequest({}), handler)
      `,
      errors: [
        {
          messageId: "filenameMustMatchFolder",
          data: { basename: "list", folder: "agents" },
        },
        { messageId: "missingContract", data: { folder: "agents" } },
      ],
    },
    // ── missingContract: route folder lacks contract.ts ─────────────────
    {
      filename: NO_CONTRACT_FILE,
      code: `
        router.get('/', validateRequest({}), handler)
      `,
      errors: [
        { messageId: "missingContract", data: { folder: "nocontract" } },
      ],
    },
    // ── queriesNotColocated: import from parent's queries/ ──────────────
    {
      filename: HANDLER_FILE,
      code: `
        import { getThings } from '../queries/get_things'
        router.get('/', validateRequest({}), handler)
      `,
      errors: [
        {
          messageId: "queriesNotColocated",
          data: { source: "../queries/get_things" },
        },
      ],
    },
    // ── queriesNotColocated: deep relative path into another queries/ ──
    {
      filename: HANDLER_FILE,
      code: `
        import { getThings } from '../../other/queries/foo'
        router.get('/', h1)
      `,
      errors: [
        {
          messageId: "queriesNotColocated",
          data: { source: "../../other/queries/foo" },
        },
      ],
    },
    // ── Compound: too many routes + name mismatch + missing contract ────
    {
      filename: FLAT_HANDLER_FILE,
      code: `
        router.get('/', h1)
        router.post('/', h2)
      `,
      errors: [
        { messageId: "tooManyRoutes", data: { count: "2" } },
        {
          messageId: "filenameMustMatchFolder",
          data: { basename: "list", folder: "agents" },
        },
        { messageId: "missingContract", data: { folder: "agents" } },
      ],
    },
    // ── sharedContract: contract.ts in a delegator folder (folder has
    //    sub-route folders of its own) must be cut into per-route contracts
    {
      filename: SHARED_CONTRACT_FILE,
      code: `
        export const sharedSchema = {}
      `,
      errors: [{ messageId: "sharedContract", data: { folder: "shared" } }],
    },
  ],
})

console.log("one-route-per-file: all tests passed")
