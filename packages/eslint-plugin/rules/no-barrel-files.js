/**
 * @fileoverview Disallow barrel files (index files that only re-export from other modules).
 *
 * A barrel file is an index.{ts,tsx,js,jsx} whose every statement is a
 * re-export (`export { … } from '…'` or `export * from '…'`).
 * These hurt tree-shaking, slow down IDE tooling, and obscure where code
 * actually lives. Import directly from the source module instead.
 */

"use strict"

/**
 * Returns true when the AST node is a re-export statement:
 *   export { foo }       from './foo';
 *   export { default }   from './bar';
 *   export *             from './baz';
 *   export type { Foo }  from './types';   (TS)
 */
function isReExport(node) {
  return (
    (node.type === "ExportNamedDeclaration" && node.source != null) ||
    node.type === "ExportAllDeclaration"
  )
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow barrel files (index files that only re-export from other modules)",
      recommended: false,
    },
    messages: {
      noBarrelFile:
        "Barrel files are not allowed. " +
        "Import directly from the source module instead of re-exporting through an index file. " +
        "Either move real logic into this file or delete it and update imports to point at the source.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    // Only inspect index files
    if (!/\/index\.[tj]sx?$/.test(filename)) {
      return {}
    }

    return {
      "Program:exit"(programNode) {
        const { body } = programNode

        // Empty files are fine
        if (body.length === 0) {
          return
        }

        // A barrel if EVERY statement is a re-export
        const everyStatementIsReExport = body.every(isReExport)

        if (everyStatementIsReExport) {
          context.report({
            node: body[0],
            messageId: "noBarrelFile",
          })
        }
      },
    }
  },
}
