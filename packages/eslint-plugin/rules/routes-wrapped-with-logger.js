/**
 * @fileoverview Require route handlers to be wrapped with a logger HOF.
 *
 * Targets `router.<method>(path, ...mw, handler)` / `app.<method>(...)` calls.
 * The final argument (the actual route handler) must be a call to the
 * configured wrapper (default: `withLogger`) so request entry/exit and errors
 * are logged through the shared logger context.
 */

"use strict"

const DEFAULT_WRAPPER = "withLogger"
const DEFAULT_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "all",
  "options",
  "head",
]

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require route handlers to be wrapped with a logger HOF (e.g. `withLogger`)",
      recommended: false,
    },
    fixable: "code",
    messages: {
      missingWrapper:
        "Route handler must be wrapped with `{{ wrapper }}(...)` so request entry/exit and errors are logged.",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          wrapperName: { type: "string", minLength: 1 },
          httpMethods: {
            type: "array",
            items: { type: "string", minLength: 1 },
            uniqueItems: true,
          },
        },
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {}
    const wrapper = options.wrapperName || DEFAULT_WRAPPER
    const methods = new Set(options.httpMethods || DEFAULT_METHODS)
    const sourceCode = context.getSourceCode()

    function isHandlerLike(node) {
      return (
        node.type === "ArrowFunctionExpression" ||
        node.type === "FunctionExpression" ||
        node.type === "Identifier" ||
        node.type === "CallExpression"
      )
    }

    function isAlreadyWrapped(node) {
      return (
        node.type === "CallExpression" &&
        node.callee.type === "Identifier" &&
        node.callee.name === wrapper
      )
    }

    return {
      CallExpression(node) {
        if (node.callee.type !== "MemberExpression") return
        const prop = node.callee.property
        if (!prop || prop.type !== "Identifier") return
        if (!methods.has(prop.name)) return
        // Route registrations always pass at least (path, handler).
        // 1-arg calls like `cache.get('k')` get filtered here.
        if (node.arguments.length < 2) return

        const last = node.arguments[node.arguments.length - 1]
        if (!last || last.type === "SpreadElement") return
        if (!isHandlerLike(last)) return
        if (isAlreadyWrapped(last)) return

        context.report({
          node: last,
          messageId: "missingWrapper",
          data: { wrapper },
          fix(fixer) {
            const text = sourceCode.getText(last)
            return fixer.replaceText(last, `${wrapper}(${text})`)
          },
        })
      },
    }
  },
}
