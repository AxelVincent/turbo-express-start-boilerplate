/**
 * @fileoverview Prevent defining test handler logic directly in cases/index.ts.
 * Handlers must be in separate files and imported.
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid defining test handler functions inline in route definition files",
    },
    messages: {
      noInlineHandler:
        "Test handlers are forbidden in route definition files. Create a new file with the handler and import it.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    // Only check index files inside __tests__/cases/ directories
    if (!/__tests__\/cases\/index\.[tj]sx?$/.test(filename)) {
      return {}
    }

    return {
      'CallExpression[callee.name="createTestRouter"]'(node) {
        const arg = node.arguments[0]
        if (!arg || arg.type !== "ObjectExpression") return

        for (const prop of arg.properties) {
          if (prop.type !== "Property") continue

          if (
            prop.value.type === "ArrowFunctionExpression" ||
            prop.value.type === "FunctionExpression"
          ) {
            context.report({
              node: prop.value,
              messageId: "noInlineHandler",
            })
          }
        }
      },
    }
  },
}
