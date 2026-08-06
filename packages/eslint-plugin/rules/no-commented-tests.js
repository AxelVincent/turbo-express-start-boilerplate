/**
 * @fileoverview Prevent commented-out test cases.
 * If a test needs to be disabled, use modifier: 'skip' with a ticket reference.
 *
 * Detection: Looks for 3+ test properties (when, then, route) appearing inside
 * block comments or consecutive line comments.
 */

"use strict"

const TEST_PROPERTIES = ["when", "then", "route"]
const MIN_MATCHES = 3

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent commented-out test cases in integration test files",
    },
    messages: {
      noCommentedTests:
        "Tests should not be commented. Remove it or skip it and create a ticket to fix it.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    // Only check integration test files
    if (!filename.endsWith(".integration.test.ts")) {
      return {}
    }

    return {
      Program() {
        const sourceCode = context.getSourceCode()
        const comments = sourceCode.getAllComments()

        // Check block comments
        for (const comment of comments) {
          if (comment.type === "Block") {
            const text = comment.value
            const matchCount = TEST_PROPERTIES.filter((prop) =>
              new RegExp(prop + "\\s*:").test(text),
            ).length

            if (matchCount >= MIN_MATCHES) {
              context.report({
                loc: comment.loc,
                messageId: "noCommentedTests",
              })
            }
          }
        }

        // Check consecutive line comments
        const lineComments = comments.filter((c) => c.type === "Line")
        for (let i = 0; i < lineComments.length; i++) {
          // Collect consecutive line comments
          let combinedText = lineComments[i].value
          let endIndex = i

          for (let j = i + 1; j < lineComments.length; j++) {
            if (
              lineComments[j].loc.start.line ===
              lineComments[j - 1].loc.start.line + 1
            ) {
              combinedText += "\n" + lineComments[j].value
              endIndex = j
            } else {
              break
            }
          }

          if (endIndex > i) {
            const matchCount = TEST_PROPERTIES.filter((prop) =>
              new RegExp(prop + "\\s*:").test(combinedText),
            ).length

            if (matchCount >= MIN_MATCHES) {
              context.report({
                loc: lineComments[i].loc,
                messageId: "noCommentedTests",
              })
            }

            i = endIndex // Skip already-processed comments
          }
        }
      },
    }
  },
}
