"use strict"

const { RuleTester } = require("eslint")
const rule = require("./max-test-cases-per-suite")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
})

ruleTester.run("max-test-cases-per-suite", rule, {
  valid: [
    {
      code: `createIntegrationTestSuite({ name: 'x' }, { when: 'a', then: 'b', route: '/a' }, { when: 'c', then: 'd', route: '/b' });`,
      options: [{ max: 3 }],
    },
    {
      code: `createIntegrationTestSuite({ name: 'x' }, { when: 'a', then: 'b', route: '/a' });`,
      options: [{ max: 1 }],
    },
  ],
  invalid: [
    {
      code: `createIntegrationTestSuite({ name: 'x' }, { when: 'a', then: 'b', route: '/a' }, { when: 'c', then: 'd', route: '/b' }, { when: 'e', then: 'f', route: '/c' });`,
      options: [{ max: 2 }],
      errors: [{ messageId: "tooManyCases", data: { max: "2" } }],
    },
  ],
})

console.log("All tests passed!")
