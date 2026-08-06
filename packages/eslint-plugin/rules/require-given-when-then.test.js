const { RuleTester } = require("eslint")
const rule = require("./require-given-when-then")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
})

ruleTester.run("require-given-when-then", rule, {
  valid: [
    {
      code: `
        export async function myTest(req) {
          // Given
          const user = await makeUser();
          // When
          const result = await user.agents.getPersona(id);
          // Then
          isDefined(result);
        }
      `,
      filename: "src/routes_web/orgs/__tests__/cases/my_test.ts",
    },
    // Not in cases/ — no enforcement
    {
      code: `export async function helper() { return 1; }`,
      filename: "tests/utils/helpers.ts",
    },
    // Index files are exempt
    {
      code: `export function handler() { return 1; }`,
      filename: "src/routes_web/orgs/__tests__/cases/index.ts",
    },
  ],
  invalid: [
    {
      code: `
        export async function myTest(req) {
          const user = await makeUser();
          const result = await user.agents.getPersona(id);
          isDefined(result);
        }
      `,
      filename: "src/routes_web/orgs/__tests__/cases/my_test.ts",
      errors: [{ messageId: "missingComments" }],
    },
    {
      code: `
        export async function myTest(req) {
          // Given
          const user = await makeUser();
          // Then
          isDefined(user);
          // When
          const result = await user.agents.getPersona(id);
        }
      `,
      filename: "src/routes_web/orgs/__tests__/cases/my_test.ts",
      errors: [{ messageId: "wrongOrder" }],
    },
    {
      code: `
        export async function myTest(req) {
          // Given
          const user = await makeUser();
          // When
          const result = await user.agents.getPersona(id);
        }
      `,
      filename: "src/routes_web/orgs/__tests__/cases/my_test.ts",
      errors: [{ messageId: "missingComments" }],
    },
  ],
})
