/**
 * @fileoverview Limit the number of React component declarations per file.
 *
 * A React component is any function whose name starts with an uppercase letter
 * and whose body contains JSX. When a file declares too many components it
 * becomes hard to navigate and signals that sub-components should be extracted
 * into their own files under `components/features/`.
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Limit the number of React component declarations in a single file",
      recommended: false,
    },
    messages: {
      tooMany:
        "This file declares {{ count }} React components (max {{ max }}). " +
        "Extract sub-components into separate files under `components/features/`.",
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const max = (context.options[0] && context.options[0].max) || 3
    const components = []

    /**
     * Check whether an AST subtree contains any JSX element or fragment.
     */
    function containsJSX(node) {
      if (!node) return false
      if (node.type === "JSXElement" || node.type === "JSXFragment") {
        return true
      }

      for (const key of Object.keys(node)) {
        if (key === "parent") continue
        const child = node[key]
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === "string" && containsJSX(item)) {
              return true
            }
          }
        } else if (child && typeof child.type === "string") {
          if (containsJSX(child)) return true
        }
      }
      return false
    }

    /**
     * Returns the function body node for either a FunctionDeclaration or
     * an ArrowFunctionExpression / FunctionExpression.
     */
    function getFunctionBody(node) {
      if (node.type === "FunctionDeclaration") return node.body
      if (
        node.type === "ArrowFunctionExpression" ||
        node.type === "FunctionExpression"
      ) {
        return node.body
      }
      return null
    }

    return {
      // function MyComponent() { return <div /> }
      FunctionDeclaration(node) {
        const name = node.id && node.id.name
        if (!name || !/^[A-Z]/.test(name)) return
        if (containsJSX(node.body)) {
          components.push(node)
        }
      },

      // const MyComponent = () => <div />
      // const MyComponent = function() { return <div /> }
      VariableDeclarator(node) {
        const name = node.id && node.id.name
        if (!name || !/^[A-Z]/.test(name)) return

        const body = getFunctionBody(node.init)
        if (body && containsJSX(body)) {
          components.push(node)
        }
      },

      "Program:exit"(programNode) {
        if (components.length > max) {
          context.report({
            node: programNode,
            messageId: "tooMany",
            data: {
              count: String(components.length),
              max: String(max),
            },
          })
        }
      },
    }
  },
}
