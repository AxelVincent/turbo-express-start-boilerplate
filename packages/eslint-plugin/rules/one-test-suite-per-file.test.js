"use strict"

const { RuleTester } = require("eslint")
const rule = require("./one-test-suite-per-file")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
})

ruleTester.run("one-test-suite-per-file", rule, {
  valid: [
    {
      code: `createIntegrationTestSuite({ name: 'todos.create' }, { when: 'x', then: 'y', route: '/create' });`,
      filename: "/src/__tests__/todos.integration.test.ts",
    },
    {
      code: `const x = 1;`,
      filename: "/src/__tests__/todos.integration.test.ts",
    },
  ],
  invalid: [
    {
      code: `
        createIntegrationTestSuite({ name: 'todos.create' }, { when: 'x', then: 'y', route: '/create' });
        createIntegrationTestSuite({ name: 'todos.delete' }, { when: 'x', then: 'y', route: '/delete' });
      `,
      filename: "/src/__tests__/todos.integration.test.ts",
      errors: [{ messageId: "onePerFile" }],
    },
  ],
})

console.log("All tests passed!")
