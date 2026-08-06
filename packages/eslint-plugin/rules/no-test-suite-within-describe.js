/**
 * @fileoverview Prevent nesting createIntegrationTestSuite inside describe blocks.
 * Suites should be top-level in each file.
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prevent createIntegrationTestSuite from being nested inside describe blocks",
    },
    messages: {
      noSuiteInDescribe:
        "Prefer splitting test suites per file instead of using describe blocks.",
    },
    schema: [],
  },

  create(context) {
    let insideDescribe = false

    return {
      'CallExpression[callee.name="describe"]'() {
        insideDescribe = true
      },

      'CallExpression[callee.name="describe"]:exit'() {
        insideDescribe = false
      },

      'CallExpression[callee.name="createIntegrationTestSuite"]'(node) {
        if (insideDescribe) {
          context.report({
            node,
            messageId: "noSuiteInDescribe",
          })
        }
      },
    }
  },
}
