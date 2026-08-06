/**
 * @fileoverview Enforce that frontend hooks call `apiClient<T>(...)` with a
 * response type `T` imported from a route contract module — not an inline
 * object shape or a locally-defined type.
 *
 * Routes export Zod schemas + inferred types from a `contract.ts` file
 * (e.g. `apps/api/src/routes_web/org/clients/get_client/contract.ts`).
 * Frontend hooks must consume those inferred types so the wire format stays
 * in sync with the schema the route validates against. Re-declaring the
 * shape on the client lets the two drift apart silently.
 *
 * Correct:
 *   import type { GetClientResponse } from '@repo/api/routes_web/org/clients/get_client/contract'
 *   apiClient<GetClientResponse>(`/web/clients/${id}`)
 *
 * Violations (in files under `lib/hooks/`):
 *   apiClient<{ items: ClientAd[] }>(...)        // inline object shape
 *   apiClient<ClientAd[]>(...)                   // ClientAd defined locally
 *   apiClient<MyResponse>(...)                   // MyResponse not from a contract
 *   mutationFn: (input: { id: string }) => ...   // inline mutation input shape
 *
 * Scope: only files inside `lib/hooks/` — these are the TanStack Query hooks
 * that wrap `apiClient`. Other files may legitimately use inline types.
 */

"use strict"

// Match e.g. '@repo/api/routes_web/org/clients/get_client/contract'
const CONTRACT_PATH_PATTERN =
  /^@repo\/api\/(routes_web|routes_tests)\/.+\/contract$/

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require apiClient<T>() in frontend hooks to use a type T imported " +
        "from a route contract module, so request/response types stay in " +
        "sync with the route's Zod schema.",
      recommended: false,
    },
    messages: {
      inlineLiteral:
        "apiClient<T>() in a hook must not use an inline type. " +
        "Define a Zod response schema in the route's contract.ts and import " +
        "its inferred type (e.g. `GetClientResponse`) instead.",
      notFromContract:
        "apiClient<T>() type '{{ name }}' is not imported from a route " +
        "contract module. Import the inferred type from " +
        "'@repo/api/routes_web/<route>/contract' so the hook stays in sync " +
        "with the API.",
      mutationInputLiteral:
        "mutationFn input type must not be an inline object shape. " +
        "Import the inferred input type from the route's contract.ts " +
        "(e.g. `CreateClientInput`) so the hook stays in sync with the API.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")
    if (!/\/lib\/hooks\//.test(filename)) return {}

    // Map of imported binding name → import source string. We track every
    // named import (type or value) because TS-ESLint surfaces them the same
    // way and we only care whether the source matches a contract path.
    const importSources = new Map()

    return {
      ImportDeclaration(node) {
        const source = node.source && node.source.value
        if (typeof source !== "string") return
        for (const spec of node.specifiers) {
          if (spec.type !== "ImportSpecifier") continue
          importSources.set(spec.local.name, source)
        }
      },

      CallExpression(node) {
        if (
          node.callee.type !== "Identifier" ||
          node.callee.name !== "apiClient"
        ) {
          return
        }

        // @typescript-eslint/parser exposes generics as `typeArguments` on
        // newer versions and `typeParameters` on older ones — handle both.
        const typeArgs = node.typeArguments || node.typeParameters
        if (!typeArgs || !typeArgs.params || typeArgs.params.length === 0) {
          // No type argument means the response is `unknown` — used for
          // void/DELETE endpoints. Nothing to enforce here.
          return
        }

        const t = typeArgs.params[0]

        // The type must be a single named reference (e.g. `GetClientResponse`)
        // — not a TSTypeLiteral, union, intersection, array, or qualified name.
        if (t.type !== "TSTypeReference" || t.typeName.type !== "Identifier") {
          context.report({ node: t, messageId: "inlineLiteral" })
          return
        }

        const name = t.typeName.name
        const source = importSources.get(name)
        if (!source || !CONTRACT_PATH_PATTERN.test(source)) {
          context.report({
            node: t,
            messageId: "notFromContract",
            data: { name },
          })
        }
      },

      // mutationFn: (input: <annotation>) => apiClient(...)
      // Flag any param whose type annotation is an inline object literal.
      Property(node) {
        if (node.key.type !== "Identifier" || node.key.name !== "mutationFn") {
          return
        }
        const fn = node.value
        if (
          fn.type !== "ArrowFunctionExpression" &&
          fn.type !== "FunctionExpression"
        ) {
          return
        }

        // Only enforce on mutation functions that actually wrap apiClient —
        // avoids false positives on unrelated `mutationFn` properties.
        const bodyText = context.getSourceCode().getText(fn.body)
        if (!/\bapiClient\b/.test(bodyText)) return

        for (const param of fn.params) {
          const ann =
            param.typeAnnotation && param.typeAnnotation.typeAnnotation
          if (!ann) continue
          if (containsTypeLiteral(ann)) {
            context.report({
              node: param,
              messageId: "mutationInputLiteral",
            })
          }
        }
      },
    }

    /**
     * Recursively check whether a type annotation contains a TSTypeLiteral
     * (object shape). Mirrors the helper in `no-manual-query-types`.
     */
    function containsTypeLiteral(n) {
      if (!n) return false
      if (n.type === "TSTypeLiteral") return true
      if (n.type === "TSArrayType") return containsTypeLiteral(n.elementType)
      if (n.type === "TSUnionType" || n.type === "TSIntersectionType") {
        return n.types.some(containsTypeLiteral)
      }
      if (n.type === "TSParenthesizedType") {
        return containsTypeLiteral(n.typeAnnotation)
      }
      if (n.type === "TSTypeReference") {
        const args = n.typeArguments || n.typeParameters
        if (args && args.params) {
          return args.params.some(containsTypeLiteral)
        }
      }
      return false
    }
  },
}
