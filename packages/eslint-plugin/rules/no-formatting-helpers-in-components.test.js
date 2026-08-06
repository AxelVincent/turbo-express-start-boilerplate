/**
 * @fileoverview Tests for no-formatting-helpers-in-components rule.
 */

"use strict"

const { RuleTester } = require("eslint")
const rule = require("./no-formatting-helpers-in-components")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
})

ruleTester.run("no-formatting-helpers-in-components", rule, {
  valid: [
    // ── Importing fmt from lib/format is fine ──
    {
      code: `import { fmt } from '@/lib/format';`,
      filename: "/src/routes/_auth/dashboard.tsx",
    },
    // ── lib/format.ts itself can define formatters ──
    {
      code: `const fmt = { num: (v) => v.toLocaleString() };`,
      filename: "/src/lib/format.ts",
    },
    // ── Non-formatter objects are fine in route files ──
    {
      code: `const config = { port: 3000 };`,
      filename: "/src/routes/_auth/settings.tsx",
    },
    // ── fmt as a function call result (not an object literal) ──
    {
      code: `const fmt = createFormatter();`,
      filename: "/src/routes/_auth/dashboard.tsx",
    },
    // ── Random files outside routes/components ──
    {
      code: `const fmt = { num: (v) => v };`,
      filename: "/src/services/analytics.ts",
    },
    // ── Variable named "format" but it's a string, not an object ──
    {
      code: `const format = 'YYYY-MM-DD';`,
      filename: "/src/components/date-picker.tsx",
    },
  ],

  invalid: [
    // ── fmt object in a route file ──
    {
      code: `const fmt = { num: (v) => v.toLocaleString(), dollar: (v) => '$' + v };`,
      filename: "/src/routes/_auth/client-ads.tsx",
      errors: [{ messageId: "noInlineFormatter", data: { name: "fmt" } }],
    },
    // ── fmt object in a component file ──
    {
      code: `const fmt = { pct: (v) => v + '%' };`,
      filename: "/src/components/features/client-ads/kpi-cards.tsx",
      errors: [{ messageId: "noInlineFormatter", data: { name: "fmt" } }],
    },
    // ── "format" name variant ──
    {
      code: `const format = { currency: (v) => '$' + v };`,
      filename: "/src/routes/dashboard.tsx",
      errors: [{ messageId: "noInlineFormatter", data: { name: "format" } }],
    },
    // ── "formatter" name variant ──
    {
      code: `const formatter = { date: (d) => d.toISOString() };`,
      filename: "/src/components/ui/date-cell.tsx",
      errors: [{ messageId: "noInlineFormatter", data: { name: "formatter" } }],
    },
    // ── "formatters" name variant ──
    {
      code: `const formatters = { num: (v) => v };`,
      filename: "/src/routes/index.tsx",
      errors: [
        { messageId: "noInlineFormatter", data: { name: "formatters" } },
      ],
    },
    // ── Deeply nested route ──
    {
      code: `const fmt = { num: (v) => v };`,
      filename:
        "/src/routes/_auth/orgs/$orgId/clients/$clientId/client-ads.tsx",
      errors: [{ messageId: "noInlineFormatter", data: { name: "fmt" } }],
    },
  ],
})

console.log("All tests passed!")
