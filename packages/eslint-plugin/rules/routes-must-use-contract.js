/**
 * @fileoverview Enforce that every Express route handler in `routes_web/` is
 * wired through `validateRequest({...})` AND that the Zod schemas it consumes
 * are imported from a sibling `contract.ts` module — never declared inline
 * in the handler file.
 *
 * Why: the contract.ts pattern lets the frontend hooks import the same
 * `z.infer<...>` types the route validates against, so request/response
 * shapes stay in sync. Schemas defined inline in the route file can't be
 * re-used and silently drift from the client.
 *
 * Scope: only files inside `routes_web/`. `routes_tests/` is test-harness
 * infrastructure (registered via `createTestRouter`) and has its own
 * conventions, so it is exempt.
 *
 * Triggers in any file inside `routes_web/` that calls
 *   router.get|post|put|patch|delete|options|head('/path', …handlers)
 *
 * Reports:
 *   - `missingValidate`: the handler chain has no `validateRequest({...})` call.
 *   - `inlineSchema`: a schema field (`paramsSchema`/`bodySchema`/…) inside
 *     `validateRequest({...})` is set to a value that isn't an identifier
 *     imported from a `./contract` (or `…/contract`) module.
 *
 * Aggregator files that only mount sub-routers via `router.use(...)` are
 * ignored — they don't define handlers.
 */

"use strict"

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
])

const SCHEMA_KEYS = new Set([
  "paramsSchema",
  "querySchema",
  "bodySchema",
  "responseSchema",
])

// Match './contract', '../contract', './contract.ts', '@…/something/contract',
// etc. We just require the import source to end with `/contract` (with an
// optional .ts extension).
const CONTRACT_SOURCE_PATTERN = /(^|\/)contract(\.ts)?$/

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Every router.<method>() handler must use validateRequest({...}) and " +
        "its schemas must come from a sibling contract.ts module.",
      recommended: false,
    },
    messages: {
      missingValidate:
        "router.{{ method }}() handler is missing validateRequest({...}). " +
        "Wrap it so request/response shapes are validated and the schemas " +
        "can be re-used by the frontend hook.",
      inlineSchema:
        "validateRequest schema '{{ key }}' must reference an identifier " +
        "imported from a sibling contract.ts module — not an inline " +
        "expression. Move the schema to ./contract.ts and import it here.",
      schemaNotFromContract:
        "validateRequest schema '{{ key }}' uses '{{ name }}' which is not " +
        "imported from a contract module (path ending in /contract). " +
        "Move the schema to ./contract.ts and import it here.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")
    if (!/\/routes_web\//.test(filename)) return {}
    // Skip the contract files themselves — they only export schemas.
    if (/\/contract\.ts$/.test(filename)) return {}

    // identifier-name → import-source-string (last write wins is fine since
    // an identifier can only resolve to one binding per module).
    const importSources = new Map()

    return {
      ImportDeclaration(node) {
        const source = node.source && node.source.value
        if (typeof source !== "string") return
        for (const spec of node.specifiers) {
          if (
            spec.type === "ImportSpecifier" ||
            spec.type === "ImportDefaultSpecifier" ||
            spec.type === "ImportNamespaceSpecifier"
          ) {
            importSources.set(spec.local.name, source)
          }
        }
      },

      CallExpression(node) {
        // Match `validateRequest({...})` calls anywhere — verifies that each
        // schema field references a contract import.
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "validateRequest"
        ) {
          checkValidateRequest(node)
          return
        }

        // Match `router.<method>(path, ...handlers)` and verify at least one
        // handler is a validateRequest({...}) call.
        if (
          node.callee.type !== "MemberExpression" ||
          node.callee.object.type !== "Identifier" ||
          node.callee.object.name !== "router" ||
          node.callee.property.type !== "Identifier" ||
          !HTTP_METHODS.has(node.callee.property.name)
        ) {
          return
        }

        const method = node.callee.property.name
        const hasValidate = node.arguments.some(
          (arg) =>
            arg.type === "CallExpression" &&
            arg.callee.type === "Identifier" &&
            arg.callee.name === "validateRequest",
        )

        if (!hasValidate) {
          context.report({
            node,
            messageId: "missingValidate",
            data: { method },
          })
        }
      },
    }

    function checkValidateRequest(node) {
      if (node.arguments.length === 0) return
      const arg = node.arguments[0]
      if (arg.type !== "ObjectExpression") {
        // Spread or variable — too dynamic to verify; the missingValidate
        // check still ensures a call exists, so leave this alone.
        return
      }

      for (const prop of arg.properties) {
        if (prop.type !== "Property") continue
        const keyName =
          prop.key.type === "Identifier"
            ? prop.key.name
            : prop.key.type === "Literal"
              ? String(prop.key.value)
              : null
        if (!keyName || !SCHEMA_KEYS.has(keyName)) continue

        // The value must be a plain identifier that's imported from a
        // contract module. Anything else (object literal, call expression,
        // member expression like `schemas.foo`) is an inline schema.
        if (prop.value.type !== "Identifier") {
          context.report({
            node: prop.value,
            messageId: "inlineSchema",
            data: { key: keyName },
          })
          continue
        }

        const source = importSources.get(prop.value.name)
        if (!source || !CONTRACT_SOURCE_PATTERN.test(source)) {
          context.report({
            node: prop.value,
            messageId: "schemaNotFromContract",
            data: { key: keyName, name: prop.value.name },
          })
        }
      }
    }
  },
}
