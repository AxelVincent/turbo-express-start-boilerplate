const { RuleTester } = require("eslint")
const rule = require("./no-direct-db-in-test-cases")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
})

ruleTester.run("no-direct-db-in-test-cases", rule, {
  valid: [
    // Domain user methods are allowed
    {
      code: `
        export async function myTest(req) {
          const ctx = await AgentTestContext.setup(req);
          await ctx.user.orgs.createOrg();
          await ctx.cleanup();
        }
      `,
      filename: "src/routes_web/orgs/__tests__/cases/my_test.ts",
    },
    // getDatabase is fine outside __tests__/cases/
    {
      code: `
        import { getDatabase } from '../../../external/database';
        const db = getDatabase();
      `,
      filename: "tests/utils/agent_test_context.ts",
    },
    // getDatabase is fine in domain user files
    {
      code: `
        import { getDatabase } from '../../../external/database';
        export class OrgsUser {
          async createOrg() { const db = getDatabase(); }
        }
      `,
      filename: "tests/user/domains/orgs_user.ts",
    },
    // Fine in index files
    {
      code: `
        import { getDatabase } from '../../../external/database';
      `,
      filename: "src/routes_web/orgs/__tests__/cases/index.ts",
    },
    // Fine in helper files
    {
      code: `
        import { getDatabase } from '../../../external/database';
      `,
      filename: "src/routes_web/orgs/__tests__/cases/_helpers.ts",
    },
  ],
  invalid: [
    {
      code: `
        import { getDatabase } from '../../../../../external/database';
        export async function myTest(req) {
          const db = getDatabase();
          await db.insertInto('agent').values({}).execute();
        }
      `,
      filename: "src/routes_web/orgs/__tests__/cases/my_test.ts",
      errors: [{ messageId: "noDbImport" }, { messageId: "noDirectDb" }],
    },
    {
      code: `
        export async function myTest(req) {
          const { getDatabase } = require('../../../../../external/database');
          const db = getDatabase();
        }
      `,
      filename: "src/routes_web/orgs/__tests__/cases/my_test.ts",
      errors: [{ messageId: "noDbImport" }, { messageId: "noDirectDb" }],
    },
  ],
})
