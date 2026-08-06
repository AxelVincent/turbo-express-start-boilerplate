/**
 * @fileoverview Flag test handlers that are too simple for integration tests.
 *
 * A handler is "too simple" if it:
 *   - Creates <=1 test users (makeUser calls)
 *   - Calls <=1 module-level functions (excluding makeUser and assertion calls)
 *   - Makes <=1 additional function calls total (excluding makeUser and assertions)
 *
 * These should be refactored to unit tests or merged with more complex cases.
 */

"use strict"

const ASSERTION_NAMES = new Set([
  "isDefined",
  "isEqual",
  "isTruthy",
  "isFalsy",
  "isNull",
  "isUndefined",
  "isGreaterThan",
  "isLessThan",
  "includes",
  "deepEqual",
  "throws",
  "doesNotThrow",
  "arrayHasLength",
  "objectHasKeys",
])

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Flag integration test handlers that are too simple and should be unit tests",
    },
    messages: {
      tooSimple:
        "Such simple integration tests are not allowed, consider refactoring it to unit test or merging with more complex case.",
    },
    schema: [],
  },

  create(context) {
    return {
      // Look for exported async functions (test handlers)
      "ExportNamedDeclaration > FunctionDeclaration"(node) {
        checkHandler(context, node)
      },
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression"(
        node,
      ) {
        checkHandler(context, node)
      },
    }
  },
}

function checkHandler(context, node) {
  const filename = context.getFilename().replace(/\\/g, "/")

  // Only check files inside __tests__/cases/ directories
  if (!/__tests__\/cases\//.test(filename)) return
  // Skip index files
  if (/\/index\.[tj]sx?$/.test(filename)) return

  let makeUserCount = 0
  let meaningfulCallCount = 0

  visitNode(node)

  function visitNode(n) {
    if (!n || typeof n !== "object") return

    if (n.type === "CallExpression") {
      const calleeName = getCalleeName(n)
      if (
        calleeName === "makeUser" ||
        calleeName === "makeUserWithOrg" ||
        calleeName === "makeNewUser"
      ) {
        makeUserCount++
      } else if (calleeName && !ASSERTION_NAMES.has(calleeName)) {
        meaningfulCallCount++
      } else if (!calleeName) {
        // Method calls like user.todos.create()
        meaningfulCallCount++
      }
    }

    // Recurse into child nodes
    for (const key of Object.keys(n)) {
      if (key === "parent") continue
      const child = n[key]
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === "object" && item.type) {
            visitNode(item)
          }
        }
      } else if (child && typeof child === "object" && child.type) {
        visitNode(child)
      }
    }
  }

  // Too simple: <=1 user AND <=1 meaningful call
  if (makeUserCount <= 1 && meaningfulCallCount <= 1) {
    context.report({
      node: node.type === "FunctionDeclaration" ? node : node.parent || node,
      messageId: "tooSimple",
    })
  }
}

function getCalleeName(callExpr) {
  const callee = callExpr.callee
  if (callee.type === "Identifier") {
    return callee.name
  }
  if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name
  }
  return null
}
