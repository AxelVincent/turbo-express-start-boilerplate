/**
 * @fileoverview Forbid raw HTTP method calls in test case handlers.
 *
 * Test cases must use domain user methods (e.g. `user.agents.create()`)
 * instead of raw HTTP calls (e.g. `user.post_auth('/orgs/agents', ...)`).
 *
 * This enforces that all API interactions go through the domain user layer,
 * keeping tests readable and route changes isolated to domain classes.
 *
 * Allowed: user.agents.create(), user.orgs.createOrg(), ctx.user.agents.getPersona()
 * Forbidden: user.get_auth(), user.post_auth(), user.put_auth(), user.del_auth(), user.patch_auth()
 */

"use strict"

const RAW_HTTP_METHODS = new Set([
  "get_auth",
  "post_auth",
  "put_auth",
  "patch_auth",
  "del_auth",
  "post_auth_with_lock_retry",
])

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid raw HTTP method calls in test case handlers — use domain user methods instead",
    },
    messages: {
      noRawHttp:
        'Do not call "{{ method }}" directly in test cases. Use a domain user method instead (e.g. user.agents.create(), user.orgs.createOrg()).',
    },
    schema: [
      {
        type: "object",
        properties: {
          additionalForbiddenMethods: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    // Only enforce in __tests__/cases/ files (not index files)
    if (!/__tests__\/cases\//.test(filename)) return {}
    if (/\/index\.[tj]sx?$/.test(filename)) return {}
    // Skip helper files (e.g. _helpers.ts)
    if (/\/_[^/]+\.[tj]sx?$/.test(filename)) return {}

    const extra =
      (context.options[0] && context.options[0].additionalForbiddenMethods) ||
      []
    const forbidden = new Set([...RAW_HTTP_METHODS, ...extra])

    return {
      "CallExpression > MemberExpression"(node) {
        if (
          node.property.type === "Identifier" &&
          forbidden.has(node.property.name)
        ) {
          context.report({
            node: node.parent,
            messageId: "noRawHttp",
            data: { method: node.property.name },
          })
        }
      },
    }
  },
}
