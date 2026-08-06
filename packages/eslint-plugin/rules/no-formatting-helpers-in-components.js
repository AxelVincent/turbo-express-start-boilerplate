/**
 * @fileoverview Disallow inline formatting helper objects in route/component files.
 *
 * Formatting helpers (e.g. `const fmt = { num: …, dollar: … }`) should be
 * centralized in `@/lib/format.ts` and imported where needed. Inline
 * definitions lead to inconsistent formatting across the codebase.
 */

"use strict"

const FORMATTER_PATTERN = /^fmt$|^format(ters?)?$/i

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow inline formatting helper objects in route and component files",
      recommended: false,
    },
    messages: {
      noInlineFormatter:
        "Formatting helper '{{ name }}' should be imported from `@/lib/format.ts`, " +
        "not defined inline. Centralizing formatters ensures consistent output across the app.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    // Only apply to route and component files
    if (!filename.includes("/routes/") && !filename.includes("/components/")) {
      return {}
    }

    return {
      VariableDeclarator(node) {
        const name = node.id && node.id.name
        if (!name || !FORMATTER_PATTERN.test(name)) return

        // Only flag object literals (not imports or function calls)
        if (node.init && node.init.type === "ObjectExpression") {
          context.report({
            node,
            messageId: "noInlineFormatter",
            data: { name },
          })
        }
      },
    }
  },
}
