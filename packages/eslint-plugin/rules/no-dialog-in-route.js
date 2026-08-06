/**
 * @fileoverview Disallow Dialog/Sheet/Modal/Drawer component declarations inside route files.
 *
 * Complex overlay components (dialogs, sheets, modals, drawers) should live in
 * `components/features/` and be imported by the route file. This keeps route
 * files focused on orchestration and layout.
 */

"use strict"

const OVERLAY_PATTERN = /Dialog|Sheet|Modal|Drawer/i

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow declaring Dialog/Sheet/Modal/Drawer components inside route files",
      recommended: false,
    },
    messages: {
      noDialog:
        "Overlay component '{{ name }}' should not be declared in a route file. " +
        "Move it to `components/features/` and import it instead.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    // Only apply to route files
    if (!filename.includes("/routes/")) {
      return {}
    }

    function checkName(node, name) {
      if (name && OVERLAY_PATTERN.test(name)) {
        context.report({
          node: node.id || node,
          messageId: "noDialog",
          data: { name },
        })
      }
    }

    return {
      // function AssignAdAccountDialog() { ... }
      FunctionDeclaration(node) {
        checkName(node, node.id && node.id.name)
      },

      // const AssignAdAccountDialog = () => { ... }
      // const AssignAdAccountDialog = function() { ... }
      VariableDeclarator(node) {
        if (
          node.init &&
          (node.init.type === "ArrowFunctionExpression" ||
            node.init.type === "FunctionExpression")
        ) {
          checkName(node, node.id && node.id.name)
        }
      },
    }
  },
}
