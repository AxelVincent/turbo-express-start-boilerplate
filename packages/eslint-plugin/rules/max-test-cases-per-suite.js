/**
 * @fileoverview Limit the number of test cases per createIntegrationTestSuite call.
 * If a suite grows beyond the limit, split it into multiple files.
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Limit test cases per integration test suite",
    },
    messages: {
      tooManyCases: "Number of test cases exceeds the max limit of {{ max }}",
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const max = (context.options[0] && context.options[0].max) || 10

    return {
      'CallExpression[callee.name="createIntegrationTestSuite"]'(node) {
        // First argument is the options object, rest are test cases
        const testCaseCount = node.arguments.length - 1
        if (testCaseCount > max) {
          context.report({
            node,
            messageId: "tooManyCases",
            data: { max: String(max) },
          })
        }
      },
    }
  },
}
