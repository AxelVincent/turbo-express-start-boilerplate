/**
 * @fileoverview Enforce that `queries/` folders contain only individual query
 * files — no helpers, no shared derivations, no business logic.
 *
 * The point of giving each query its own file is reuse: any caller can import
 * a query without dragging along unrelated logic. That contract breaks the
 * moment a `queries/` folder hosts shared helpers (mapRow with derived fields,
 * pctChange, period math, metrics shape) — those callers now transitively
 * pull in business logic that lives in the wrong layer.
 *
 * This rule reports two violations on files under any `queries/` directory:
 *
 *   1. `queries/_*.ts` (helper files) must not exist. Inline trivial shape
 *      mappers into the query function; move shared derivations / math /
 *      aggregations into the calling service.
 *
 *   2. Inside `queries/<name>.ts`, any private (non-exported) top-level
 *      function declaration or arrow-function const is flagged. The query
 *      file should contain exactly the exported query and nothing else.
 *
 * `queries/index.ts` is skipped (barrel files are handled by `no-barrel-files`).
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce that `queries/` folders contain only individual query files — no helpers, no business logic, no shared derivations",
      recommended: false,
    },
    messages: {
      helperFile:
        "Helper files are not allowed inside a `queries/` folder. " +
        "The folder must contain only individual query files so callers can import a query without dragging in unrelated logic. " +
        "Inline trivial pure shape mappers into each query, and move shared derivations (math, aggregations, derived fields, period math) into the calling service.",
      privateHelper:
        "Query files (`queries/<name>.ts`) must contain only the exported query — private helper `{{ name }}` is business logic in disguise. " +
        "Inline it into the query function, or move shared derivations (math, aggregations, deltas, derived fields) into the calling service.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    const isInsideQueriesFolder = /\/queries\//.test(filename)
    if (!isInsideQueriesFolder) return {}

    const isIndexFile = /\/queries\/index\.[tj]sx?$/.test(filename)
    if (isIndexFile) return {}

    const isHelperFile = /\/queries\/_[^/]+\.[tj]sx?$/.test(filename)
    if (isHelperFile) {
      return {
        Program(node) {
          context.report({ node, messageId: "helperFile" })
        },
      }
    }

    const exportedNames = new Set()
    const candidates = []

    return {
      ExportNamedDeclaration(node) {
        if (node.declaration) {
          if (
            node.declaration.type === "FunctionDeclaration" &&
            node.declaration.id
          ) {
            exportedNames.add(node.declaration.id.name)
          }
          if (node.declaration.type === "VariableDeclaration") {
            for (const d of node.declaration.declarations) {
              if (d.id && d.id.type === "Identifier") {
                exportedNames.add(d.id.name)
              }
            }
          }
        }
        if (node.specifiers && node.specifiers.length > 0) {
          for (const s of node.specifiers) {
            if (s.local && s.local.type === "Identifier") {
              exportedNames.add(s.local.name)
            }
          }
        }
      },

      ExportDefaultDeclaration(node) {
        if (!node.declaration) return
        if (
          node.declaration.type === "FunctionDeclaration" &&
          node.declaration.id
        ) {
          exportedNames.add(node.declaration.id.name)
        } else if (node.declaration.type === "Identifier") {
          exportedNames.add(node.declaration.name)
        }
      },

      // Top-level `function foo() {}` (not wrapped in an export keyword —
      // those go through ExportNamedDeclaration, so don't fire this selector)
      "Program > FunctionDeclaration"(node) {
        if (node.id && node.id.type === "Identifier") {
          candidates.push({ name: node.id.name, node })
        }
      },

      // Top-level `const foo = () => …` / `const foo = function() {}`
      "Program > VariableDeclaration"(node) {
        for (const d of node.declarations) {
          if (
            d.init &&
            (d.init.type === "ArrowFunctionExpression" ||
              d.init.type === "FunctionExpression") &&
            d.id &&
            d.id.type === "Identifier"
          ) {
            candidates.push({ name: d.id.name, node: d })
          }
        }
      },

      "Program:exit"() {
        for (const { name, node } of candidates) {
          if (exportedNames.has(name)) continue
          context.report({
            node,
            messageId: "privateHelper",
            data: { name },
          })
        }
      },
    }
  },
}
