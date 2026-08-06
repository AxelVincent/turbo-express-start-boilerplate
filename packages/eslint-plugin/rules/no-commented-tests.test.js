"use strict"

const { RuleTester } = require("eslint")
const rule = require("./no-commented-tests")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
})

ruleTester.run("no-commented-tests", rule, {
  valid: [
    // Normal test file with no commented tests
    {
      code: `createIntegrationTestSuite({ name: 'x' }, { when: 'a', then: 'b', route: '/a' });`,
      filename: "/src/x.integration.test.ts",
    },
    // Regular comment
    {
      code: `// This is a normal comment\nconst x = 1;`,
      filename: "/src/x.integration.test.ts",
    },
    // Non-integration test file — ignored
    {
      code: `/* { when: 'a', then: 'b', route: '/x' } */`,
      filename: "/src/x.test.ts",
    },
  ],
  invalid: [
    // Block comment with test properties
    {
      code: `/* { when: 'a user creates', then: 'it appears', route: '/create' } */`,
      filename: "/src/x.integration.test.ts",
      errors: [{ messageId: "noCommentedTests" }],
    },
    // Consecutive line comments with test properties
    {
      code: `// when: 'a user creates',\n// then: 'it appears',\n// route: '/create'`,
      filename: "/src/x.integration.test.ts",
      errors: [{ messageId: "noCommentedTests" }],
    },
  ],
})

console.log("All tests passed!")
