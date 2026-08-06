/**
 * @fileoverview Tests for no-inline-queries rule.
 */

"use strict"

const { RuleTester } = require("eslint")
const rule = require("./no-inline-queries")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
})

ruleTester.run("no-inline-queries", rule, {
  valid: [
    // ── Query builders are what queries/ files are for ────────────────
    {
      code: `
        import { getDatabase } from '../../db/database'
        export async function getUserById(id: string) {
          return getDatabase().selectFrom('user').selectAll().where('id', '=', id).executeTakeFirst()
        }
      `,
      filename: "/src/services/users/queries/get_user_by_id.ts",
    },
    // ── Migrations legitimately touch the schema directly ─────────────
    {
      code: `
        export async function up(db: any) {
          await db.deleteFrom('user').where('email', 'is', null).execute()
        }
      `,
      filename: "/src/db/migrations/001_initial.ts",
    },
    // ── The db setup module itself ────────────────────────────────────
    {
      code: `
        export const checkDatabaseHealth = async () =>
          getDatabase().selectFrom('user').select('id').limit(1).execute()
      `,
      filename: "/src/db/database.ts",
    },
    // ── Tests may set up and assert against rows directly ─────────────
    {
      code: `
        it('creates a user', async () => {
          await db.insertInto('user').values({ id: '1' }).execute()
        })
      `,
      filename: "/src/routes_web/users/__tests__/users.integration.test.ts",
    },
    {
      code: `await db.deleteFrom('user').execute()`,
      filename: "/tests/user/seed.ts",
    },
    // ── A service that delegates to a query file is the happy path ────
    {
      code: `
        import { getUserById } from './queries/get_user_by_id'
        export async function loadUser(id: string) {
          return getUserById(id)
        }
      `,
      filename: "/src/services/users/load_user.ts",
    },
    // ── Unrelated member names are untouched ──────────────────────────
    {
      code: `
        export function render(rows: string[]) {
          return rows.map((r) => r.trim())
        }
      `,
      filename: "/src/services/users/render.ts",
    },
  ],

  invalid: [
    // ── A select inside a route handler ───────────────────────────────
    {
      code: `
        router.get('/', async (req, res) => {
          const users = await getDatabase().selectFrom('user').selectAll().execute()
          res.json(users)
        })
      `,
      filename: "/src/routes_web/users/get_users/get_users.ts",
      errors: [{ messageId: "inlineQuery", data: { method: "selectFrom" } }],
    },
    // ── An insert inside a service ────────────────────────────────────
    {
      code: `
        export async function createUser(email: string) {
          return getDatabase().insertInto('user').values({ email }).execute()
        }
      `,
      filename: "/src/services/users/create_user.ts",
      errors: [{ messageId: "inlineQuery", data: { method: "insertInto" } }],
    },
    // ── An update inside a middleware ─────────────────────────────────
    {
      code: `
        export const touchSession = async (id: string) => {
          await getDatabase().updateTable('session').set({ seen: true }).where('id', '=', id).execute()
        }
      `,
      filename: "/src/middlewares/touch_session.ts",
      errors: [{ messageId: "inlineQuery", data: { method: "updateTable" } }],
    },
    // ── A delete inside a queue processor ─────────────────────────────
    {
      code: `
        export async function purge() {
          await getDatabase().deleteFrom('audit_log').execute()
        }
      `,
      filename: "/src/queues/purge.ts",
      errors: [{ messageId: "inlineQuery", data: { method: "deleteFrom" } }],
    },
    // ── Several builders in one file → one report each ────────────────
    {
      code: `
        export async function swap() {
          await getDatabase().deleteFrom('a').execute()
          await getDatabase().insertInto('b').values({}).execute()
        }
      `,
      filename: "/src/services/misc/swap.ts",
      errors: [
        { messageId: "inlineQuery", data: { method: "deleteFrom" } },
        { messageId: "inlineQuery", data: { method: "insertInto" } },
      ],
    },
  ],
})

console.log("All tests passed!")
