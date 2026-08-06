/**
 * @fileoverview Enforce one exported test handler per file in test cases.
 *
 * Each test case file in __tests__/cases/ must export exactly one function.
 * This keeps tests focused and makes the test suite easier to navigate.
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce one exported test handler per file in test case directories",
    },
    messages: {
      tooManyExports:
        "Test case files must export exactly one test handler. This file exports {{ count }}. Split into separate files.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    if (!/__tests__\/cases\//.test(filename)) return {}
    if (/\/index\.[tj]sx?$/.test(filename)) return {}
    if (/\/_[^/]+\.[tj]sx?$/.test(filename)) return {}

    let exportCount = 0
    let firstExport = null

    return {
      ExportNamedDeclaration(node) {
        exportCount++
        if (exportCount === 1) {
          firstExport = node
        }
      },

      "Program:exit"() {
        if (exportCount > 1) {
          context.report({
            node: firstExport,
            messageId: "tooManyExports",
            data: { count: String(exportCount) },
          })
        }
      },
    }
  },
}
