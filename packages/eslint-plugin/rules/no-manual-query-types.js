/**
 * @fileoverview Enforce that exported types in `queries/` folders are derived
 * from DB types or runtime values — never manually written object shapes.
 *
 * Allowed (type annotation is a utility type reference):
 *   export type FooItem = ReturnType<typeof mapFoo>
 *   export type FooRow  = Selectable<Foos>
 *   export type FooItem = Awaited<ReturnType<typeof query>>[number]
 *   export type FooId   = Pick<Selectable<Foos>, 'id'>
 *
 * Also allowed (non-object types):
 *   export type Status = 'active' | 'inactive'
 *   export type FooId  = string
 *
 * Disallowed (manually written object shapes):
 *   export type FooItem = { id: string; name: string }
 *   export interface FooItem { id: string; name: string }
 *
 * Scope: all files inside a `queries/` directory, including _-prefixed helpers.
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow manually-defined object types in queries/ folders. " +
        "Types must be inferred from DB types via ReturnType, Selectable, etc.",
      recommended: false,
    },
    messages: {
      noManualType:
        "Don't define object types manually in queries/ folders. " +
        "Derive them from DB types: `ReturnType<typeof mapper>`, `Selectable<Table>`, etc.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    if (!/\/queries\//.test(filename)) return {}

    return {
      ExportNamedDeclaration(node) {
        const decl = node.declaration
        if (!decl) return

        // export interface Foo { ... } — always banned
        if (decl.type === "TSInterfaceDeclaration") {
          context.report({ node: decl, messageId: "noManualType" })
          return
        }

        // export type Foo = <annotation>
        if (decl.type === "TSTypeAliasDeclaration") {
          if (containsObjectLiteral(decl.typeAnnotation)) {
            context.report({ node: decl, messageId: "noManualType" })
          }
        }
      },
    }

    /**
     * Recursively check whether a type annotation contains a TSTypeLiteral
     * (object shape). This catches:
     *   - Direct:       { id: string }
     *   - Intersection: Foo & { extra: string }
     *   - Union:        { a: 1 } | { b: 2 }
     *
     * It does NOT flag utility wrappers (ReturnType, Selectable, Pick, etc.)
     * because their arguments are TSTypeReference, not TSTypeLiteral.
     */
    function containsObjectLiteral(node) {
      if (!node) return false

      if (node.type === "TSTypeLiteral") return true

      // Intersection: A & B
      if (node.type === "TSIntersectionType") {
        return node.types.some(containsObjectLiteral)
      }

      // Union: A | B
      if (node.type === "TSUnionType") {
        return node.types.some(containsObjectLiteral)
      }

      // Parenthesized: (A)
      if (node.type === "TSParenthesizedType") {
        return containsObjectLiteral(node.typeAnnotation)
      }

      return false
    }
  },
}
