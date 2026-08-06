/**
 * @fileoverview Forbid Kysely query-builder calls outside a `queries/` folder.
 *
 * Service code, route handlers, and job processors must delegate DB access to a
 * dedicated `queries/<query_name>.ts` file (one query per file — see
 * `one-query-per-file`). This rule flags any direct use of Kysely's
 * `selectFrom`, `insertInto`, `updateTable`, or `deleteFrom` outside of
 * `queries/` files, migrations, the db/ setup module, and tests.
 */

"use strict"

const QUERY_METHODS = new Set([
  "selectFrom",
  "insertInto",
  "updateTable",
  "deleteFrom",
])

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Forbid Kysely query-builder calls outside a `queries/` folder",
      recommended: false,
    },
    messages: {
      inlineQuery:
        "DB query (`{{ method }}`) must live inside a `queries/<query_name>.ts` file. " +
        "Move this query into its own file under a sibling `queries/` folder and import it from there.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    // Files allowed to call query-builder methods directly.
    const isInsideQueriesFolder = /\/queries\//.test(filename)
    const isMigration = /\/db\/migrations\//.test(filename)
    const isDbSetup = /\/db\/database\.[tj]sx?$/.test(filename)
    const isTest =
      /\/__tests__\//.test(filename) || /\.test\.[tj]sx?$/.test(filename)
    const isSeed =
      /\/seeds?\//.test(filename) || /seed\.[tj]sx?$/.test(filename)

    if (isInsideQueriesFolder || isMigration || isDbSetup || isTest || isSeed) {
      return {}
    }

    return {
      MemberExpression(node) {
        if (
          node.property &&
          node.property.type === "Identifier" &&
          QUERY_METHODS.has(node.property.name)
        ) {
          context.report({
            node: node.property,
            messageId: "inlineQuery",
            data: { method: node.property.name },
          })
        }
      },
    }
  },
}
