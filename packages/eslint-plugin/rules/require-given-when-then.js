/**
 * @fileoverview Enforce Given/When/Then comment structure in test case handlers.
 *
 * Every exported function in __tests__/cases/ must contain comments
 * matching "// Given", "// When", and "// Then" (in that order).
 */

"use strict"

const REQUIRED_COMMENTS = ["Given", "When", "Then"]

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce Given/When/Then comment structure in test case handlers",
    },
    messages: {
      missingComments:
        'Test handler must contain "// Given", "// When", and "// Then" comments (in order). Missing: {{ missing }}.',
      wrongOrder:
        '"// Given", "// When", and "// Then" comments must appear in that order.',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    if (!/__tests__\/cases\//.test(filename)) return {}
    if (/\/index\.[tj]sx?$/.test(filename)) return {}
    if (/\/_[^/]+\.[tj]sx?$/.test(filename)) return {}

    const sourceCode = context.getSourceCode()

    function checkHandler(node) {
      const body = node.type === "FunctionDeclaration" ? node.body : node.body
      if (!body) return

      // Get all comments within the function body range
      const comments = sourceCode
        .getAllComments()
        .filter(
          (c) =>
            c.type === "Line" &&
            c.range[0] >= body.range[0] &&
            c.range[1] <= body.range[1],
        )

      const found = []
      for (const comment of comments) {
        const trimmed = comment.value.trim()
        for (const keyword of REQUIRED_COMMENTS) {
          if (trimmed === keyword) {
            found.push({ keyword, pos: comment.range[0] })
          }
        }
      }

      const foundKeywords = found.map((f) => f.keyword)
      const missing = REQUIRED_COMMENTS.filter(
        (k) => !foundKeywords.includes(k),
      )

      if (missing.length > 0) {
        context.report({
          node,
          messageId: "missingComments",
          data: { missing: missing.map((m) => `"// ${m}"`).join(", ") },
        })
        return
      }

      // Check order
      const positions = REQUIRED_COMMENTS.map((k) =>
        found.find((f) => f.keyword === k),
      )
      for (let i = 1; i < positions.length; i++) {
        if (positions[i].pos <= positions[i - 1].pos) {
          context.report({
            node,
            messageId: "wrongOrder",
          })
          return
        }
      }
    }

    return {
      "ExportNamedDeclaration > FunctionDeclaration"(node) {
        checkHandler(node)
      },
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression"(
        node,
      ) {
        checkHandler(node)
      },
    }
  },
}
