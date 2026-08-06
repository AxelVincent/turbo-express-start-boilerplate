/**
 * @fileoverview Enforce that every Express route handler in `routes_web/` lives
 * in its own self-contained folder.
 *
 * The canonical layout for a leaf route is:
 *
 *   <route>/
 *     <route>.ts        — the router file (named after the folder)
 *     contract.ts       — zod schemas for params/query/body/response
 *     queries/          — query files used by this route (optional)
 *
 * Six checks:
 *   1. tooManyRoutes        — a non-index file declares more than one
 *                             `router.<method>(...)` handler. Each handler must
 *                             be its own file.
 *   2. handlerInIndex       — an `index.ts` file declares a `router.<method>(...)`
 *                             handler. Index files must only delegate via
 *                             `router.use(...)`; handlers belong in dedicated
 *                             files mounted from here.
 *   3. filenameMustMatchFolder — a non-index handler file's basename does not
 *                             match its parent folder name. The convention is
 *                             `<route>/<route>.ts` so the file path mirrors
 *                             the URL path.
 *   4. missingContract      — a handler file's folder does not contain a
 *                             `contract.ts`. Every route folder must hold its
 *                             own contract so it is self-describing.
 *   5. queriesNotColocated  — a handler file imports from a relative
 *                             `queries/` path that is not its own sibling
 *                             `./queries/`. Queries used by a route must live
 *                             in that route folder's own `queries/`.
 *   6. sharedContract       — a `contract.ts` lives in a folder whose
 *                             sub-folders contain their own route files
 *                             (i.e. a delegator folder). Each leaf route must
 *                             carry its own contract; shared contracts must be
 *                             cut into per-route ones.
 *
 * Scope: files inside `routes_web/`, excluding anything inside a `queries/`
 * subfolder.
 */

"use strict"

const path = require("path")
const fs = require("fs")

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
  "all",
])

function folderHasSubRoutes(dir) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return false
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name === "queries") continue
    const subRouteFile = path.join(dir, entry.name, `${entry.name}.ts`)
    if (fs.existsSync(subRouteFile)) return true
  }
  return false
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "In routes_web/, every router.<method>() handler must live in its own " +
        "self-contained folder with <route>.ts, contract.ts, and any queries " +
        "colocated under queries/.",
      recommended: false,
    },
    messages: {
      tooManyRoutes:
        "This file declares {{ count }} route handlers. Each router.<method>() " +
        "handler must live in its own file inside a sibling folder named after " +
        "the route, mounted from index.ts via router.use(...).",
      handlerInIndex:
        "index.ts may only delegate via router.use(...). Move this " +
        "router.{{ method }}() handler into its own '<route>/<route>.ts' file " +
        "and mount it from here with router.use('/<route>', <route>Router).",
      filenameMustMatchFolder:
        "Route handler file '{{ basename }}.ts' must be named after its parent " +
        "folder ('{{ folder }}/{{ folder }}.ts') so the file path mirrors the URL.",
      missingContract:
        "Route folder '{{ folder }}/' is missing contract.ts. Every route " +
        "folder must contain its own contract.ts alongside '{{ folder }}.ts'.",
      queriesNotColocated:
        "Query import '{{ source }}' is not colocated. Queries used by this " +
        "route must live in its own './queries/' folder, not '{{ source }}'.",
      sharedContract:
        "contract.ts in delegator folder '{{ folder }}/' is shared across " +
        "sub-routes. Cut its schemas into each leaf route's own contract.ts " +
        "and remove this file.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    if (!/\/routes_web\//.test(filename)) return {}
    if (/\/queries\//.test(filename)) return {}

    const ext = path.extname(filename)
    const basename = path.basename(filename, ext)
    const dir = path.dirname(filename)
    const parentFolder = path.basename(dir)

    if (basename === "contract") {
      return {
        "Program:exit"(programNode) {
          if (folderHasSubRoutes(dir)) {
            context.report({
              node: programNode,
              messageId: "sharedContract",
              data: { folder: parentFolder },
            })
          }
        },
      }
    }

    const isIndex = basename === "index"

    /** @type {{ node: any, method: string }[]} */
    const handlerCalls = []
    /** @type {{ node: any, source: string }[]} */
    const queryImports = []

    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "router" &&
          node.callee.property.type === "Identifier" &&
          HTTP_METHODS.has(node.callee.property.name)
        ) {
          handlerCalls.push({ node, method: node.callee.property.name })
        }
      },

      ImportDeclaration(node) {
        const source = node.source.value
        if (typeof source !== "string") return
        if (!source.startsWith(".")) return
        if (!/(^|\/)queries(\/|$)/.test(source)) return
        if (source === "./queries" || source.startsWith("./queries/")) return
        queryImports.push({ node, source })
      },

      "Program:exit"(programNode) {
        if (isIndex) {
          for (const { node, method } of handlerCalls) {
            context.report({
              node,
              messageId: "handlerInIndex",
              data: { method },
            })
          }
          return
        }

        if (handlerCalls.length > 1) {
          context.report({
            node: handlerCalls[0].node,
            messageId: "tooManyRoutes",
            data: { count: String(handlerCalls.length) },
          })
        }

        if (handlerCalls.length > 0 && basename !== parentFolder) {
          context.report({
            node: programNode,
            messageId: "filenameMustMatchFolder",
            data: { basename, folder: parentFolder },
          })
        }

        if (handlerCalls.length > 0) {
          const contractPath = path.join(dir, "contract.ts")
          if (!fs.existsSync(contractPath)) {
            context.report({
              node: programNode,
              messageId: "missingContract",
              data: { folder: parentFolder },
            })
          }

          for (const { node, source } of queryImports) {
            context.report({
              node,
              messageId: "queriesNotColocated",
              data: { source },
            })
          }
        }
      },
    }
  },
}
