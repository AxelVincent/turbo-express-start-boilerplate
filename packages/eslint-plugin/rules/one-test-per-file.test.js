const { RuleTester } = require("eslint")
const rule = require("./one-test-per-file")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
})

ruleTester.run("one-test-per-file", rule, {
  valid: [
    {
      code: `export async function myTest(req) { }`,
      filename: "src/routes_web/orgs/__tests__/cases/my_test.ts",
    },
    // Multiple exports fine outside cases/
    {
      code: `
        export async function testA(req) { }
        export async function testB(req) { }
      `,
      filename: "tests/utils/helpers.ts",
    },
    // Index files are exempt
    {
      code: `
        export { testA } from './test_a';
        export { testB } from './test_b';
      `,
      filename: "src/routes_web/orgs/__tests__/cases/index.ts",
    },
    // Helper files are exempt
    {
      code: `
        export function helperA() { }
        export function helperB() { }
      `,
      filename: "src/routes_web/orgs/__tests__/cases/_helpers.ts",
    },
  ],
  invalid: [
    {
      code: `
        export async function testA(req) { }
        export async function testB(req) { }
      `,
      filename: "src/routes_web/orgs/__tests__/cases/my_tests.ts",
      errors: [{ messageId: "tooManyExports", data: { count: "2" } }],
    },
  ],
})
