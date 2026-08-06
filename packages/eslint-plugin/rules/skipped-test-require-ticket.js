/**
 * @fileoverview Require that skipped tests (modifier: 'skip') include a reference
 * to a tracking ticket in a preceding comment.
 */

"use strict"

const URL_PATTERN = /https?:\/\/\S+/

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require skipped integration tests to reference a tracking ticket",
    },
    messages: {
      missingTicket: "Skipped test must include a ticket",
    },
    schema: [],
  },

  create(context) {
    return {
      'CallExpression[callee.name="createIntegrationTestSuite"]'(node) {
        const testCases = node.arguments.slice(1)
        const sourceCode = context.getSourceCode()

        for (const testCase of testCases) {
          if (testCase.type !== "ObjectExpression") continue

          const modifierProp = testCase.properties.find(
            (p) =>
              p.type === "Property" &&
              p.key.type === "Identifier" &&
              p.key.name === "modifier" &&
              p.value.type === "Literal" &&
              p.value.value === "skip",
          )

          if (!modifierProp) continue

          // Check comments before this test case object
          const commentsBefore = sourceCode.getCommentsBefore(testCase)
          const hasTicket = commentsBefore.some((comment) =>
            URL_PATTERN.test(comment.value),
          )

          if (!hasTicket) {
            context.report({
              node: modifierProp,
              messageId: "missingTicket",
            })
          }
        }
      },
    }
  },
}
