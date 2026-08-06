const { RuleTester } = require("eslint")
const rule = require("./no-raw-http-in-test-cases")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
})

ruleTester.run("no-raw-http-in-test-cases", rule, {
  valid: [
    // Domain user methods are allowed
    {
      code: `
        export async function myTest(req) {
          const ctx = await AgentTestContext.setup(req);
          const persona = await ctx.user.agents.getPersona(ctx.agent.id);
        }
      `,
      filename: "src/routes_web/orgs/persona/__tests__/cases/get_persona.ts",
    },
    // Raw HTTP is fine outside __tests__/cases/
    {
      code: `
        const result = await user.get_auth('/orgs/agents');
      `,
      filename: "tests/utils/some_helper.ts",
    },
    // Raw HTTP is fine in index files
    {
      code: `
        const result = await user.post_auth('/orgs/agents', {});
      `,
      filename: "src/routes_web/orgs/__tests__/cases/index.ts",
    },
    // Raw HTTP is fine in helper files (prefixed with _)
    {
      code: `
        export async function helper() {
          return user.post_auth('/orgs/agents', {}, 201);
        }
      `,
      filename: "src/routes_web/orgs/__tests__/cases/_helpers.ts",
    },
  ],
  invalid: [
    {
      code: `
        export async function myTest(req) {
          const user = await makeUser();
          const result = await user.get_auth('/orgs/agents/123/persona');
        }
      `,
      filename: "src/routes_web/orgs/persona/__tests__/cases/get_persona.ts",
      errors: [{ messageId: "noRawHttp", data: { method: "get_auth" } }],
    },
    {
      code: `
        export async function myTest(req) {
          const user = await makeUser();
          await user.post_auth('/orgs/agents', { name: 'Test' }, 201);
        }
      `,
      filename: "src/routes_web/orgs/persona/__tests__/cases/create.ts",
      errors: [{ messageId: "noRawHttp", data: { method: "post_auth" } }],
    },
    {
      code: `
        export async function myTest(req) {
          await user.put_auth('/orgs/agents/123/persona', { name: 'X' });
          await user.del_auth('/orgs/agents/123');
        }
      `,
      filename: "src/routes_web/orgs/__tests__/cases/update.ts",
      errors: [
        { messageId: "noRawHttp", data: { method: "put_auth" } },
        { messageId: "noRawHttp", data: { method: "del_auth" } },
      ],
    },
  ],
})
