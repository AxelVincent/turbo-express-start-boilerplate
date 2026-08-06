"use strict"

const { RuleTester } = require("eslint")
const rule = require("./skipped-test-require-ticket")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
})

ruleTester.run("skipped-test-require-ticket", rule, {
  valid: [
    // Non-skipped test — no ticket needed
    {
      code: `createIntegrationTestSuite({ name: 'x' }, { when: 'a', then: 'b', route: '/a' });`,
    },
    // Skipped test with ticket in preceding comment
    {
      code: `createIntegrationTestSuite({ name: 'x' },
        // https://github.com/my-org/my-repo/issues/123
        { when: 'a', then: 'b', route: '/a', modifier: 'skip' }
      );`,
    },
  ],
  invalid: [
    // Skipped test without ticket
    {
      code: `createIntegrationTestSuite({ name: 'x' }, { when: 'a', then: 'b', route: '/a', modifier: 'skip' });`,
      errors: [{ messageId: "missingTicket" }],
    },
  ],
})

console.log("All tests passed!")
