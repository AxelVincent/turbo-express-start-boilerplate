"use strict"

const { RuleTester } = require("eslint")
const rule = require("./unique-routes-per-suite")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
})

ruleTester.run("unique-routes-per-suite", rule, {
  valid: [
    {
      code: `createIntegrationTestSuite({ name: 'x' }, { when: 'a', then: 'b', route: '/create' }, { when: 'c', then: 'd', route: '/delete' });`,
    },
  ],
  invalid: [
    {
      code: `createIntegrationTestSuite({ name: 'x' }, { when: 'a', then: 'b', route: '/create' }, { when: 'c', then: 'd', route: '/create' });`,
      errors: [{ messageId: "duplicateRoute" }],
    },
  ],
})

console.log("All tests passed!")
