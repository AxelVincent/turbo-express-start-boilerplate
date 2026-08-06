/**
 * @fileoverview Enforce one createIntegrationTestSuite call per file.
 * Improves CI sharding — each file becomes a unit of parallelism.
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce one createIntegrationTestSuite call per integration test file",
    },
    messages: {
      onePerFile:
        "Prefer having one test suite per file to improve utilization of sharding.",
    },
    schema: [],
  },

  create(context) {
    let callCount = 0
    let secondCallNode = null

    return {
      'CallExpression[callee.name="createIntegrationTestSuite"]'(node) {
        callCount++
        if (callCount === 2) {
          secondCallNode = node
        }
      },

      "Program:exit"() {
        if (callCount > 1 && secondCallNode) {
          context.report({
            node: secondCallNode,
            messageId: "onePerFile",
          })
        }
      },
    }
  },
}
