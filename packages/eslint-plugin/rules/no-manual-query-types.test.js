/**
 * @fileoverview Tests for no-manual-query-types rule.
 */

"use strict"

const { RuleTester } = require("eslint")
const rule = require("./no-manual-query-types")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
})

ruleTester.run("no-manual-query-types", rule, {
  valid: [
    // ── Derived from a mapper's return type ───────────────────────────
    {
      code: `export type UserItem = ReturnType<typeof mapUser>`,
      filename: "/src/services/users/queries/get_users.ts",
    },
    // ── Derived from the generated Kysely table type ──────────────────
    {
      code: `export type UserRow = Selectable<User>`,
      filename: "/src/services/users/queries/get_user_by_id.ts",
    },
    // ── Unwrapping an async query's result ────────────────────────────
    {
      code: `export type UserItem = Awaited<ReturnType<typeof getUsers>>[number]`,
      filename: "/src/services/users/queries/get_users.ts",
    },
    // ── Narrowing a derived type still stays derived ──────────────────
    {
      code: `export type UserId = Pick<Selectable<User>, 'id'>`,
      filename: "/src/services/users/queries/get_user_by_id.ts",
    },
    // ── Non-object types are fine: unions and primitives ──────────────
    {
      code: `export type Status = 'active' | 'inactive'`,
      filename: "/src/services/users/queries/list_statuses.ts",
    },
    {
      code: `export type UserId = string`,
      filename: "/src/services/users/queries/get_user_by_id.ts",
    },
    // ── A non-exported object type is not part of the query's surface ─
    {
      code: `type Internal = { id: string }`,
      filename: "/src/services/users/queries/get_users.ts",
    },
    // ── Outside queries/, hand-written shapes are allowed ─────────────
    {
      code: `export type UserDto = { id: string; name: string }`,
      filename: "/src/services/users/types.ts",
    },
    {
      code: `export interface UserDto { id: string }`,
      filename: "/src/routes_web/users/get_users/contract.ts",
    },
  ],

  invalid: [
    // ── A hand-written object shape ───────────────────────────────────
    {
      code: `export type UserItem = { id: string; name: string }`,
      filename: "/src/services/users/queries/get_users.ts",
      errors: [{ messageId: "noManualType" }],
    },
    // ── An exported interface is always a hand-written shape ──────────
    {
      code: `export interface UserItem { id: string; name: string }`,
      filename: "/src/services/users/queries/get_users.ts",
      errors: [{ messageId: "noManualType" }],
    },
    // ── An object literal grafted onto a derived type ─────────────────
    {
      code: `export type UserItem = Selectable<User> & { extra: string }`,
      filename: "/src/services/users/queries/get_users.ts",
      errors: [{ messageId: "noManualType" }],
    },
    // ── A union of object literals ────────────────────────────────────
    {
      code: `export type Result = { ok: true } | { ok: false }`,
      filename: "/src/services/users/queries/get_users.ts",
      errors: [{ messageId: "noManualType" }],
    },
    // ── Helper files under queries/ are in scope too ──────────────────
    {
      code: `export type Row = { id: string }`,
      filename: "/src/services/users/queries/_shared.ts",
      errors: [{ messageId: "noManualType" }],
    },
  ],
})

console.log("All tests passed!")
