/**
 * @fileoverview Detect test handlers that are >=95% similar in AST structure.
 * Suggests merging them or removing redundancy.
 *
 * Compares handler ASTs pairwise within the same directory.
 * This rule works at the file level — it compares exported function bodies
 * within the same file and flags those exceeding the similarity threshold.
 *
 * Note: Cross-file comparison requires a processor or post-processing step.
 * This implementation compares multiple exported handlers within the same file.
 */

"use strict"

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Detect test handlers that are very similar and suggest merging",
    },
    messages: {
      tooSimilar:
        "This test case is very similar to the following test cases: {{ testCases }}. Consider merging them or removing redundant test cases.",
    },
    schema: [
      {
        type: "object",
        properties: {
          threshold: { type: "number", minimum: 0, maximum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const threshold =
      (context.options[0] && context.options[0].threshold) || 0.95
    const exportedHandlers = []

    return {
      "ExportNamedDeclaration > FunctionDeclaration"(node) {
        const filename = context.getFilename().replace(/\\/g, "/")
        if (!/__tests__\/cases\//.test(filename)) return
        if (/\/index\.[tj]sx?$/.test(filename)) return

        exportedHandlers.push({
          name: node.id ? node.id.name : "anonymous",
          node,
          body: node.body,
        })
      },

      "Program:exit"() {
        if (exportedHandlers.length < 2) return

        for (let i = 0; i < exportedHandlers.length; i++) {
          const similar = []
          for (let j = i + 1; j < exportedHandlers.length; j++) {
            const sim = computeSimilarity(
              exportedHandlers[i].body,
              exportedHandlers[j].body,
            )
            if (sim >= threshold) {
              similar.push(exportedHandlers[j].name)
            }
          }
          if (similar.length > 0) {
            context.report({
              node: exportedHandlers[i].node,
              messageId: "tooSimilar",
              data: { testCases: similar.join(", ") },
            })
          }
        }
      },
    }
  },
}

/**
 * Compute structural similarity between two AST nodes.
 * Returns a value between 0 (completely different) and 1 (identical structure).
 */
function computeSimilarity(nodeA, nodeB) {
  const tokensA = flattenAST(nodeA)
  const tokensB = flattenAST(nodeB)

  if (tokensA.length === 0 && tokensB.length === 0) return 1
  if (tokensA.length === 0 || tokensB.length === 0) return 0

  const maxLen = Math.max(tokensA.length, tokensB.length)
  let matches = 0

  // Simple token-level comparison
  const minLen = Math.min(tokensA.length, tokensB.length)
  for (let i = 0; i < minLen; i++) {
    if (tokensA[i] === tokensB[i]) {
      matches++
    }
  }

  return matches / maxLen
}

/**
 * Flatten an AST node into a sequence of type tokens for comparison.
 * Ignores literal values and identifiers to focus on structure.
 */
function flattenAST(node) {
  const tokens = []

  function visit(n) {
    if (!n || typeof n !== "object") return
    if (n.type) {
      tokens.push(n.type)
    }
    for (const key of Object.keys(n)) {
      if (
        key === "parent" ||
        key === "loc" ||
        key === "range" ||
        key === "start" ||
        key === "end"
      )
        continue
      const child = n[key]
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === "object" && item.type) {
            visit(item)
          }
        }
      } else if (child && typeof child === "object" && child.type) {
        visit(child)
      }
    }
  }

  visit(node)
  return tokens
}
