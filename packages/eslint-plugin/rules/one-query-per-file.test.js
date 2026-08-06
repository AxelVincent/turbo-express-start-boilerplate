/**
 * @fileoverview Tests for one-query-per-file rule.
 */

"use strict"

const { RuleTester } = require("eslint")
const rule = require("./one-query-per-file")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
})

ruleTester.run("one-query-per-file", rule, {
  valid: [
    // ── queries/ folder: single export per file ──────────────────────
    {
      code: `export async function getAgentById(id: string) { return null; }`,
      filename: "/src/services/agent/queries/get-agent-by-id.ts",
    },
    {
      code: `export const getAgentById = async (id: string) => null;`,
      filename: "/src/services/agent/queries/get-agent-by-id.ts",
    },
    // ── queries/ index.ts is skipped (barrel detection is @repo/no-barrel-files)
    {
      code: `export { getAgentById } from './get-agent-by-id';\nexport { createAgent } from './create-agent';`,
      filename: "/src/services/agent/queries/index.ts",
    },
    {
      code: `export { default as getAgent } from './get-agent';\nexport { default as createAgent } from './create-agent';`,
      filename: "/src/services/agent/queries/index.ts",
    },
    // ── Non-query files are ignored ──────────────────────────────────
    {
      code: `export function handler() {}\nexport function middleware() {}`,
      filename: "/src/routes/agent/get.ts",
    },
    {
      code: `export const A = 1;\nexport const B = 2;\nexport function C() {}`,
      filename: "/src/services/agent/types.ts",
    },
    // ── queries.ts with zero exports is fine (just types/helpers) ────
    {
      code: `function helper() { return 1; }\nconst internal = 'x';`,
      filename: "/src/services/agent/queries.ts",
    },
    // ── queries/ folder: single default export ───────────────────────
    {
      code: `export default async function getAgentById(id: string) { return null; }`,
      filename: "/src/services/agent/queries/get-agent-by-id.ts",
    },
    // ── _helpers.ts can have multiple exports ──────────────────────
    {
      code: `export function mapDbToApi(db) { return db; }\nexport function parseRow(row) { return row; }`,
      filename: "/src/services/agent/queries/_helpers.ts",
    },
  ],

  invalid: [
    // ── Monolithic queries.ts with exports → should be a folder ──────
    {
      code: `export async function getAgentById(id: string) { return null; }`,
      filename: "/src/services/agent/queries.ts",
      errors: [{ messageId: "monolithicQueriesFile" }],
    },
    {
      code: `export async function getAgentById() {}\nexport async function createAgent() {}`,
      filename: "/src/services/agent/queries.ts",
      errors: [{ messageId: "monolithicQueriesFile" }],
    },
    {
      code: `export const getAgent = () => null;`,
      filename: "/src/services/agent/queries.ts",
      errors: [{ messageId: "monolithicQueriesFile" }],
    },
    {
      code: `export interface ConversationQuery { page: number; }`,
      filename: "/src/services/conversations/queries.ts",
      errors: [{ messageId: "monolithicQueriesFile" }],
    },
    // ── queries/ folder: more than one export ────────────────────────
    {
      code: `export async function getAgentById() {}\nexport async function getAgentBySlug() {}`,
      filename: "/src/services/agent/queries/get-agent.ts",
      errors: [
        {
          messageId: "tooManyExports",
          data: { count: "2" },
        },
      ],
    },
    {
      code: `export const getAgent = () => null;\nexport const createAgent = () => null;\nexport const deleteAgent = () => null;`,
      filename: "/src/services/agent/queries/agent-queries.ts",
      errors: [
        {
          messageId: "tooManyExports",
          data: { count: "3" },
        },
      ],
    },
    {
      code: `export default function getAgent() {}\nexport function helper() {}`,
      filename: "/src/services/agent/queries/get-agent.ts",
      errors: [
        {
          messageId: "tooManyExports",
          data: { count: "2" },
        },
      ],
    },
    // ── const destructuring counts each declarator ───────────────────
    {
      code: `export const a = 1, b = 2;`,
      filename: "/src/services/agent/queries/multi.ts",
      errors: [
        {
          messageId: "tooManyExports",
          data: { count: "2" },
        },
      ],
    },
  ],
})

console.log("All tests passed!")
