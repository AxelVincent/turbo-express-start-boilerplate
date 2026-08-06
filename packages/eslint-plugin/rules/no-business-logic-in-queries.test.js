/**
 * @fileoverview Tests for no-business-logic-in-queries rule.
 */

"use strict"

const { RuleTester } = require("eslint")
const rule = require("./no-business-logic-in-queries")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
})

ruleTester.run("no-business-logic-in-queries", rule, {
  valid: [
    // ── A query file with only the exported query is fine ────────────
    {
      code: `
        import { getDatabase } from '../../db/database'
        export async function getAgentById(id: string) {
          const db = getDatabase()
          return db.selectFrom('agents').selectAll().where('id', '=', id).executeTakeFirst()
        }
      `,
      filename: "/src/services/agent/queries/get_agent_by_id.ts",
    },
    // ── Type aliases / interfaces at the top level are fine ──────────
    {
      code: `
        type Row = { id: string; name: string }
        interface Args { id: string }
        export async function getAgent(args: Args): Promise<Row | undefined> { return undefined }
      `,
      filename: "/src/services/agent/queries/get_agent.ts",
    },
    // ── Top-level constants (non-function) are fine ──────────────────
    {
      code: `
        const STATUSES = ['active', 'paused'] as const
        export async function listAgents() { return STATUSES }
      `,
      filename: "/src/services/agent/queries/list_agents.ts",
    },
    // ── Re-export pattern: function declared then exported via specifier
    {
      code: `
        function getAgent() { return null }
        export { getAgent }
      `,
      filename: "/src/services/agent/queries/get_agent.ts",
    },
    // ── Default export of a previously-declared function ─────────────
    {
      code: `
        function getAgent() { return null }
        export default getAgent
      `,
      filename: "/src/services/agent/queries/get_agent.ts",
    },
    // ── queries/index.ts (barrel) is left alone here ─────────────────
    {
      code: `export { getAgent } from './get_agent'`,
      filename: "/src/services/agent/queries/index.ts",
    },
    // ── Files outside any queries/ directory are left alone ──────────
    {
      code: `
        function compute(a: number, b: number) { return a + b }
        export function service() { return compute(1, 2) }
      `,
      filename: "/src/services/agent/agent_service.ts",
    },
  ],

  invalid: [
    // ── A private helper function next to the exported query ─────────
    {
      code: `
        function pctChange(a: number, b: number) { return (a - b) / b }
        export async function getAdsForPeriod() { return pctChange(1, 2) }
      `,
      filename: "/src/services/client_ads/queries/get_ads_for_period.ts",
      errors: [{ messageId: "privateHelper", data: { name: "pctChange" } }],
    },
    // ── A private arrow-function const ───────────────────────────────
    {
      code: `
        const computeDeltas = (rows: any[]) => rows.map((r) => r.value)
        export async function getAdsForPeriod() { return computeDeltas([]) }
      `,
      filename: "/src/services/client_ads/queries/get_ads_for_period.ts",
      errors: [{ messageId: "privateHelper", data: { name: "computeDeltas" } }],
    },
    // ── A private function expression assigned to a const ────────────
    {
      code: `
        const aggregateInputs = function (rows: any[]) { return rows.length }
        export async function getAdsForPeriod() { return aggregateInputs([]) }
      `,
      filename: "/src/services/client_ads/queries/get_ads_for_period.ts",
      errors: [
        { messageId: "privateHelper", data: { name: "aggregateInputs" } },
      ],
    },
    // ── Multiple private helpers — one report per helper ─────────────
    {
      code: `
        function toInt(v: string) { return parseInt(v, 10) }
        function toStr(v: string) { return v }
        function snapshotInputs(r: any) { return r }
        export async function getAdsForPeriod() {
          return { i: toInt('1'), s: toStr('x'), r: snapshotInputs({}) }
        }
      `,
      filename: "/src/services/client_ads/queries/get_ads_for_period.ts",
      errors: [
        { messageId: "privateHelper", data: { name: "toInt" } },
        { messageId: "privateHelper", data: { name: "toStr" } },
        { messageId: "privateHelper", data: { name: "snapshotInputs" } },
      ],
    },
    // ── Async private helpers count too ──────────────────────────────
    {
      code: `
        async function aggregateSnapshots(id: string) { return id }
        export async function getAdsForPeriod() { return aggregateSnapshots('x') }
      `,
      filename: "/src/services/client_ads/queries/get_ads_for_period.ts",
      errors: [
        { messageId: "privateHelper", data: { name: "aggregateSnapshots" } },
      ],
    },
    // ── _helpers.ts in queries/ is forbidden outright ────────────────
    {
      code: `
        export function mapRow(r: any) { return { id: r.id } }
      `,
      filename: "/src/services/client_ads/queries/_helpers.ts",
      errors: [{ messageId: "helperFile" }],
    },
    {
      code: `
        export function pctChange(a: number, b: number) { return (a - b) / b }
      `,
      filename: "/src/services/client_ads/queries/_metrics.ts",
      errors: [{ messageId: "helperFile" }],
    },
    // ── Even an empty _period.ts is reported (its existence is the violation)
    {
      code: `export const HOUR = 3600`,
      filename: "/src/services/client_ads/queries/_period.ts",
      errors: [{ messageId: "helperFile" }],
    },
  ],
})

console.log("All tests passed!")
