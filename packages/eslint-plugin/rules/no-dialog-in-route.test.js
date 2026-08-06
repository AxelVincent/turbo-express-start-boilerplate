/**
 * @fileoverview Tests for no-dialog-in-route rule.
 */

"use strict"

const { RuleTester } = require("eslint")
const rule = require("./no-dialog-in-route")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
})

ruleTester.run("no-dialog-in-route", rule, {
  valid: [
    // ── Non-route file — dialog is fine ──
    {
      code: `function AssignAdAccountDialog() { return null; }`,
      filename: "/src/components/features/client-ads/assign-account-dialog.tsx",
    },
    // ── Route file — non-dialog component is fine ──
    {
      code: `function ClientAdsPage() { return null; }`,
      filename: "/src/routes/_auth/client-ads.tsx",
    },
    // ── Route file — non-dialog arrow component ──
    {
      code: `const KpiCards = () => null;`,
      filename: "/src/routes/_auth/dashboard.tsx",
    },
    // ── Route file — variable that is not a function ──
    {
      code: `const dialogConfig = { title: "Hello" };`,
      filename: "/src/routes/_auth/settings.tsx",
    },
    // ── Route file — imported dialog (not declared) ──
    {
      code: `import { AssignAdAccountDialog } from '@/components/features/client-ads/assign-account-dialog';`,
      filename: "/src/routes/_auth/client-ads.tsx",
    },
  ],

  invalid: [
    // ── Function declaration with "Dialog" in name ──
    {
      code: `function AssignAdAccountDialog() { return null; }`,
      filename: "/src/routes/_auth/client-ads.tsx",
      errors: [
        { messageId: "noDialog", data: { name: "AssignAdAccountDialog" } },
      ],
    },
    // ── Arrow function with "Dialog" ──
    {
      code: `const SelectCampaignsDialog = () => null;`,
      filename: "/src/routes/_auth/client-ads.tsx",
      errors: [
        { messageId: "noDialog", data: { name: "SelectCampaignsDialog" } },
      ],
    },
    // ── Function expression with "Sheet" ──
    {
      code: `const AdDetailSheet = function() { return null; };`,
      filename: "/src/routes/_auth/client-ads.tsx",
      errors: [{ messageId: "noDialog", data: { name: "AdDetailSheet" } }],
    },
    // ── "Modal" variant ──
    {
      code: `function ConfirmModal() { return null; }`,
      filename: "/src/routes/settings.tsx",
      errors: [{ messageId: "noDialog", data: { name: "ConfirmModal" } }],
    },
    // ── "Drawer" variant ──
    {
      code: `const FilterDrawer = () => null;`,
      filename: "/src/routes/_auth/filters.tsx",
      errors: [{ messageId: "noDialog", data: { name: "FilterDrawer" } }],
    },
    // ── Case insensitive match ──
    {
      code: `function myDialog() { return null; }`,
      filename: "/src/routes/test.tsx",
      errors: [{ messageId: "noDialog", data: { name: "myDialog" } }],
    },
    // ── Deeply nested route ──
    {
      code: `function AssignAdAccountDialog() { return null; }`,
      filename:
        "/src/routes/_auth/orgs/$orgId/clients/$clientId/offers/$offerId/phase-2/client-ads.tsx",
      errors: [
        { messageId: "noDialog", data: { name: "AssignAdAccountDialog" } },
      ],
    },
  ],
})

console.log("All tests passed!")
