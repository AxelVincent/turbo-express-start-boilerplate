/**
 * @fileoverview Enforce a maximum line count for route files.
 *
 * Route files (TanStack Router file-based routing) should be thin
 * orchestrators — they wire up data fetching and compose feature components.
 * When they grow past a threshold, sub-components should be extracted into
 * `components/features/`.
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a maximum line count for route files to keep them as thin orchestrators",
      recommended: false,
    },
    messages: {
      tooLong:
        "Route file is {{ count }} lines (max {{ max }}). " +
        "Extract components into `components/features/`.",
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
    const max = (context.options[0] && context.options[0].max) || 200
    const filename = context.getFilename().replace(/\\/g, "/")

    // Only apply to route files
    if (!filename.includes("/routes/")) {
      return {}
    }

    return {
      "Program:exit"(node) {
        const lines = context.getSourceCode().lines.length
        if (lines > max) {
          context.report({
            node,
            messageId: "tooLong",
            data: {
              count: String(lines),
              max: String(max),
            },
          })
        }
      },
    }
  },
}
