/**
 * @fileoverview Ensure each test case in a suite has a unique route property.
 * Duplicate routes shadow each other at the Express router level.
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure unique route properties in integration test suite cases",
    },
    messages: {
      duplicateRoute: "Each test case must have a unique route",
    },
    schema: [],
  },

  create(context) {
    return {
      'CallExpression[callee.name="createIntegrationTestSuite"]'(node) {
        // Skip the first argument (options object), rest are test cases
        const testCases = node.arguments.slice(1)
        const seenRoutes = new Map()

        for (const testCase of testCases) {
          if (testCase.type !== "ObjectExpression") continue

          const routeProp = testCase.properties.find(
            (p) =>
              p.type === "Property" &&
              p.key.type === "Identifier" &&
              p.key.name === "route",
          )

          if (!routeProp || routeProp.value.type !== "Literal") continue

          const routeValue = routeProp.value.value
          if (seenRoutes.has(routeValue)) {
            context.report({
              node: routeProp,
              messageId: "duplicateRoute",
            })
          } else {
            seenRoutes.set(routeValue, routeProp)
          }
        }
      },
    }
  },
}
