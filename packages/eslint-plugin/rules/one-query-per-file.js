/**
 * @fileoverview Enforce that queries live in a `queries/` folder with one query per file.
 *
 * Two violations:
 * 1. A file named `queries.ts` (monolithic) that contains exported declarations
 *    → should be split into individual files inside a `queries/` folder.
 * 2. A file inside a `queries/` directory (other than index.ts and _-prefixed
 *    helper files) that exports more than one binding → only one query per file allowed.
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce queries are colocated in a `queries/` folder with one query per file",
      recommended: false,
    },
    messages: {
      monolithicQueriesFile:
        "Queries must live in a `queries/` folder, not a single `queries.ts` file. " +
        "Split this file into individual files inside a `queries/` directory (one export per file) " +
        "and import each query directly from its file.",
      tooManyExports:
        "Only one query per file is allowed inside a `queries/` folder. " +
        "This file has {{ count }} exports. Move each query into its own file.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename()

    // Normalize path separators for Windows compat
    const normalized = filename.replace(/\\/g, "/")

    const isMonolithicQueriesFile = /\/queries\.[tj]sx?$/.test(normalized)
    const isInsideQueriesFolder = /\/queries\//.test(normalized)
    const isIndexFile = /\/queries\/index\.[tj]sx?$/.test(normalized)
    const isHelperFile = /\/queries\/_[^/]+\.[tj]sx?$/.test(normalized)

    // Track named exports in the file
    let exportCount = 0
    let firstExportNode = null

    /**
     * Increment export counter and stash the first export node for reporting.
     */
    function trackExport(node) {
      exportCount++
      if (exportCount === 1) {
        firstExportNode = node
      }
    }

    return {
      // export function foo() {}
      // export async function foo() {}
      // export class Foo {}
      ExportNamedDeclaration(node) {
        if (node.declaration) {
          // `export const a = 1, b = 2` counts as 2
          if (
            node.declaration.type === "VariableDeclaration" &&
            node.declaration.declarations
          ) {
            for (const decl of node.declaration.declarations) {
              trackExport(decl)
            }
          } else {
            trackExport(node)
          }
        }

        // `export { foo, bar }` — each specifier is an export
        if (node.specifiers && node.specifiers.length > 0) {
          for (const spec of node.specifiers) {
            trackExport(spec)
          }
        }
      },

      // export default …
      ExportDefaultDeclaration(node) {
        trackExport(node)
      },

      // Report at the end of the program so we have the full count
      "Program:exit"(programNode) {
        // Rule 1: monolithic queries.ts with any exports → must be a folder
        if (isMonolithicQueriesFile && exportCount > 0) {
          context.report({
            node: firstExportNode || programNode,
            messageId: "monolithicQueriesFile",
          })
          return // Don't double-report
        }

        // Rule 2: file inside queries/ (not index, not _helper) with >1 export
        // Index files are skipped here — barrel detection is handled by @repo/no-barrel-files
        if (
          isInsideQueriesFolder &&
          !isIndexFile &&
          !isHelperFile &&
          exportCount > 1
        ) {
          context.report({
            node: firstExportNode || programNode,
            messageId: "tooManyExports",
            data: { count: String(exportCount) },
          })
        }
      },
    }
  },
}
