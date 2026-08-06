/**
 * @fileoverview Forbid direct database access in test case handlers.
 *
 * Test cases must use domain user helpers (e.g. `user.orgs.createOrg()`)
 * instead of calling `getDatabase()` or importing from `external/database`.
 *
 * This enforces that database setup/teardown is encapsulated in domain
 * user classes or shared test contexts, keeping test cases focused on
 * behavior rather than infrastructure.
 *
 * Allowed: user.orgs.createOrg(), ctx.cleanup()
 * Forbidden: getDatabase(), db.insertInto(), db.deleteFrom()
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid direct database access in test case handlers — use domain user helpers instead",
    },
    messages: {
      noDirectDb:
        'Do not call "getDatabase()" directly in test cases. Encapsulate database operations in domain user classes (e.g. OrgsUser, AgentsUser) or shared test contexts.',
      noDbImport:
        'Do not import from "{{ source }}" in test cases. Use domain user classes instead.',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    // Only enforce in __tests__/cases/ files (not index files)
    if (!/__tests__\/cases\//.test(filename)) return {}
    if (/\/index\.[tj]sx?$/.test(filename)) return {}
    // Skip helper files
    if (/\/_[^/]+\.[tj]sx?$/.test(filename)) return {}

    return {
      // Flag getDatabase() calls
      'CallExpression[callee.name="getDatabase"]'(node) {
        context.report({
          node,
          messageId: "noDirectDb",
        })
      },

      // Flag imports from database module
      ImportDeclaration(node) {
        const source = node.source.value
        if (
          typeof source === "string" &&
          (source.includes("external/database") ||
            source.includes("db/database"))
        ) {
          context.report({
            node,
            messageId: "noDbImport",
            data: { source },
          })
        }
      },

      // Flag require() calls to database module
      'CallExpression[callee.name="require"]'(node) {
        const arg = node.arguments[0]
        if (
          arg &&
          arg.type === "Literal" &&
          typeof arg.value === "string" &&
          (arg.value.includes("external/database") ||
            arg.value.includes("db/database"))
        ) {
          context.report({
            node,
            messageId: "noDbImport",
            data: { source: arg.value },
          })
        }
      },
    }
  },
}
