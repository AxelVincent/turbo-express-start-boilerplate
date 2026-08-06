/**
 * @fileoverview Tests for no-barrel-files rule.
 */

"use strict"

const { RuleTester } = require("eslint")
const rule = require("./no-barrel-files")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
})

ruleTester.run("no-barrel-files", rule, {
  valid: [
    // ── Index file with own declarations is NOT a barrel ───────────────
    {
      code: `export function createApp() { return null; }`,
      filename: "/src/index.ts",
    },
    {
      code: `export default class App {}`,
      filename: "/src/components/App/index.tsx",
    },
    {
      code: `export const CONFIG = { port: 3000 };\nexport type Config = typeof CONFIG;`,
      filename: "/src/config/index.ts",
    },
    // ── Index file with mixed re-exports and own declarations ──────────
    {
      code: `export { foo } from './foo';\nexport function bar() {}`,
      filename: "/src/utils/index.ts",
    },
    {
      code: `export * from './types';\nexport const VERSION = '1.0.0';`,
      filename: "/src/lib/index.ts",
    },
    // ── Empty index file is fine ───────────────────────────────────────
    {
      code: ``,
      filename: "/src/empty/index.ts",
    },
    // ── Non-index files are always ignored (even if they only re-export)
    {
      code: `export { foo } from './foo';\nexport { bar } from './bar';`,
      filename: "/src/utils/re-exports.ts",
    },
    {
      code: `export * from './types';`,
      filename: "/src/services/agent/queries/types.ts",
    },
    // ── Index file with side-effect statements ─────────────────────────
    {
      code: `import './polyfill';\nexport { foo } from './foo';`,
      filename: "/src/index.ts",
    },
    {
      code: `console.log('loading');\nexport * from './module';`,
      filename: "/src/lib/index.ts",
    },
    // ── Index file with only imports (no re-exports) ───────────────────
    {
      code: `import { something } from './something';\nconst x = something();`,
      filename: "/src/init/index.ts",
    },
  ],

  invalid: [
    // ── Pure re-export barrels ─────────────────────────────────────────
    {
      code: `export { foo } from './foo';`,
      filename: "/src/utils/index.ts",
      errors: [{ messageId: "noBarrelFile" }],
    },
    {
      code: `export { foo } from './foo';\nexport { bar } from './bar';`,
      filename: "/src/utils/index.ts",
      errors: [{ messageId: "noBarrelFile" }],
    },
    {
      code: `export * from './foo';\nexport * from './bar';\nexport * from './baz';`,
      filename: "/src/services/index.ts",
      errors: [{ messageId: "noBarrelFile" }],
    },
    {
      code: `export { default as Foo } from './Foo';\nexport { default as Bar } from './Bar';`,
      filename: "/src/components/index.tsx",
      errors: [{ messageId: "noBarrelFile" }],
    },
    // ── Single re-export is still a barrel ─────────────────────────────
    {
      code: `export * from './module';`,
      filename: "/src/lib/index.ts",
      errors: [{ messageId: "noBarrelFile" }],
    },
    // ── Mixed named and star re-exports ────────────────────────────────
    {
      code: `export * from './types';\nexport { createClient } from './client';`,
      filename: "/src/sdk/index.ts",
      errors: [{ messageId: "noBarrelFile" }],
    },
    // ── TypeScript type re-exports ─────────────────────────────────────
    {
      code: `export type { Foo } from './foo';\nexport type { Bar } from './bar';`,
      filename: "/src/types/index.ts",
      errors: [{ messageId: "noBarrelFile" }],
    },
    // ── Deeply nested barrel ───────────────────────────────────────────
    {
      code: `export { getAgent } from './get-agent';\nexport { createAgent } from './create-agent';`,
      filename: "/src/services/agent/queries/index.ts",
      errors: [{ messageId: "noBarrelFile" }],
    },
    // ── Real-world queries/ barrel with value + type re-exports ────────
    {
      code: [
        `export { getConversations } from "./get-conversations";`,
        `export { getConversationById } from "./get-conversation-by-id";`,
        `export { createConversation } from "./create-conversation";`,
        `export { addMessage } from "./add-message";`,
        `// Re-export types that external consumers import from this path`,
        `export type {`,
        `  ConversationQuery,`,
        `  TimeInterval,`,
        `  StatsQuery,`,
        `} from "../types";`,
      ].join("\n"),
      filename: "/src/services/conversations/queries/index.ts",
      errors: [{ messageId: "noBarrelFile" }],
    },
    // ── .js extension ──────────────────────────────────────────────────
    {
      code: `export { foo } from './foo';\nexport { bar } from './bar';`,
      filename: "/src/utils/index.js",
      errors: [{ messageId: "noBarrelFile" }],
    },
    // ── .jsx extension ─────────────────────────────────────────────────
    {
      code: `export { default as Button } from './Button';`,
      filename: "/src/components/index.jsx",
      errors: [{ messageId: "noBarrelFile" }],
    },
  ],
})

console.log("All tests passed!")
