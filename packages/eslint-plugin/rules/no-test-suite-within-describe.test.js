"use strict"

const { RuleTester } = require("eslint")
const rule = require("./no-test-suite-within-describe")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
})

ruleTester.run("no-test-suite-within-describe", rule, {
  valid: [
    {
      code: `createIntegrationTestSuite({ name: 'todos' }, { when: 'x', then: 'y', route: '/a' });`,
    },
  ],
  invalid: [
    {
      code: `describe('todos', () => { createIntegrationTestSuite({ name: 'todos' }, { when: 'x', then: 'y', route: '/a' }); });`,
      errors: [{ messageId: "noSuiteInDescribe" }],
    },
  ],
})

console.log("All tests passed!")
