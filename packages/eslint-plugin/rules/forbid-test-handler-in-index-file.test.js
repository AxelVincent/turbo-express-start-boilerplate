"use strict"

const { RuleTester } = require("eslint")
const rule = require("./forbid-test-handler-in-index-file")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
})

ruleTester.run("forbid-test-handler-in-index-file", rule, {
  valid: [
    // Proper: imported handlers
    {
      code: `
        import { createTodo } from './create';
        const router = createTestRouter({ '/create': createTodo });
      `,
      filename: "/src/__tests__/cases/index.ts",
    },
    // Non-index file — ignored
    {
      code: `
        const router = createTestRouter({ '/create': async () => {} });
      `,
      filename: "/src/__tests__/cases/create.ts",
    },
  ],
  invalid: [
    {
      code: `
        const router = createTestRouter({
          '/create': async () => { const user = await makeUser(); }
        });
      `,
      filename: "/src/__tests__/cases/index.ts",
      errors: [{ messageId: "noInlineHandler" }],
    },
    {
      code: `
        const router = createTestRouter({
          '/create': function() { return 1; }
        });
      `,
      filename: "/src/__tests__/cases/index.ts",
      errors: [{ messageId: "noInlineHandler" }],
    },
  ],
})

console.log("All tests passed!")
