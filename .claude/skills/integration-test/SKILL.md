---
name: integration-test
description: Create integration tests for an API route following the dual-layer architecture with domain-driven user classes, automatic cleanup, and Given/When/Then structure. Use when the user wants to add integration tests, test an endpoint, or create a test suite.
disable-model-invocation: true
argument-hint: "[route-path or feature-name]"
---

# Create Integration Test Suite

Create integration tests for: **$ARGUMENTS**

## Architecture

Tests use a dual-layer system:

- **Layer 1 — Jest declaration** (`*.integration.test.ts`): Lists scenarios via `createIntegrationTestSuite`. Zero test logic.
- **Layer 2 — Express handlers** (`cases/*.ts`): Async functions running server-side with real DB, auth, and services.

Flow: Jest → GET `/apitests/<route>` → handler runs on server → throws = 500 (fail) → completes = 200 (pass).

**Cleanup is automatic.** The `UserManager` tracks all orgs created during a test suite and deletes them (with DB cascade) when users are unlocked in `afterAll`. Test handlers never need to call `deleteOrg()`, `cleanup()`, or delete child resources.

## Steps

### 1. Read the route to test

Read the handler at `$ARGUMENTS` and its sibling `contract.ts`. Understand the HTTP method, path, Zod schemas, middleware chain, and service functions.

### 2. Create or extend the domain user class

Every API interaction in a test handler must go through a **domain user method** — never raw HTTP calls (`user.get_auth()`, `user.post_auth()`, etc.) or direct DB access (`getDatabase()`). These are enforced by lint rules and will fail CI.

Check existing domains in `tests/user/domains/`:

| Domain         | Access        | Key Operations                                                                                            |
| -------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `user.orgs`    | `OrgsUser`    | `createOrg(overrides?)`, `createInvitation(...)`                                                          |
| `user.agents`  | `AgentsUser`  | `create(overrides?)`, `list()`, `delete(id)`, `getPersona(id)`, `updatePersona(id, payload)`              |
| `user.auth`    | `AuthUser`    | `signupNewAccount(overrides?, expectedCode?)`                                                             |
| `user.me`      | `MeUser`      | `getProfile()`, `getOrganizations()`                                                                      |
| `user.apiKeys` | `ApiKeysUser` | `insertKey(orgId, provider, key)`, `getKey(orgId, provider)`, `getAllKeys(orgId)`, `deleteAllKeys(orgId)` |

If the route being tested doesn't have a domain method, **create one**:

1. Create `tests/user/domains/<feature>_user.ts`:

```typescript
import type { BaseUser } from "../base_user"
import type { ExpectedResponseCode } from "../../utils/requests"

export class FeatureUser {
  constructor(private readonly user: BaseUser) {}

  async configure(
    agentId: string,
    payload: Record<string, unknown>,
    expectedCode: ExpectedResponseCode = 200,
  ) {
    return this.user.put_auth<ResponseType>(
      `/orgs/agents/${agentId}/feature`,
      payload,
      expectedCode,
    )
  }

  async getSettings(agentId: string, expectedCode: ExpectedResponseCode = 200) {
    return this.user.get_auth<ResponseType>(
      `/orgs/agents/${agentId}/feature`,
      expectedCode,
    )
  }
}
```

2. Register in `tests/user/user.ts`:

```typescript
import { FeatureUser } from './domains/feature_user'
// Add field, init in constructor, add getter
private readonly _feature: FeatureUser
this._feature = new FeatureUser(this)
get feature(): FeatureUser { return this._feature }
```

### 3. Create the test files

Create this file structure:

```
src/routes_web/<scope>/<resource>/__tests__/
  ├── <resource>.integration.test.ts
  └── cases/
      ├── index.ts
      └── <scenario>.ts (one per test case)
```

#### Jest declaration (`<resource>.integration.test.ts`)

```typescript
import { createIntegrationTestSuite } from "<relative>/tests/utils/create_integration_test_suite"

createIntegrationTestSuite(
  { name: "<feature>", routePrefix: "/<feature>" },
  { when: "<user action>", then: "<expected result>", route: "/<case_name>" },
  // ... more cases
)
```

Options per case: `noAuth`, `concurrent` (default true, set false for shared state), `modifier` ('skip'|'only'), `timeout`, `body` (triggers POST).

#### Cases index (`cases/index.ts`)

```typescript
import { createTestRouter } from "<relative>/tests/utils/routes"
import { myCase } from "./my_case"

const router = createTestRouter({ "/my_case": myCase })
export default ["/<feature>", router]
```

#### Case handler (`cases/<scenario>.ts`)

Each file exports exactly **one** async function. Must contain `// Given`, `// When`, `// Then` comments in order.

Tests read like a real step-by-step user journey: create user → create org → create agent → domain operations → assertions.

```typescript
import type { Request } from "express"
import { makeUserWithOrg } from "<relative>/tests/utils/user"
import { isEqual, isDefined } from "<relative>/tests/utils/assertions"

export async function myScenario(req: Request) {
  const groupKey = req.headers["x-test-user-seed"] as string

  // Given
  const { user, orgId } = await makeUserWithOrg(groupKey)
  const agent = await user.agents.create()
  await user.feature.configure(agent.id, { enabled: true })

  // When
  const result = await user.feature.getSettings(agent.id)

  // Then
  isDefined(result)
  isEqual("enabled", result.enabled, true)
}
```

For complex setup contexts, use `AgentTestContext.setup(req)` (gives user + org + agent) or `ProgressionTestContext.setup(req)` (gives user + org + agent + stage + topic).

### 4. Verify

The server auto-discovers `cases/index.ts` files at startup. **Restart the API server** after adding new test files.

```bash
pnpm --filter @repo/api test:integration -- --testPathPattern="<feature>"
```

## Lint rules (violations fail CI)

### On `*.integration.test.ts`:

- One `createIntegrationTestSuite` per file, max 10 cases, unique routes
- No commented-out tests; skipped tests need a ticket reference

### On `cases/*.ts`:

- **`require-given-when-then`** — Must have `// Given`, `// When`, `// Then` in order
- **`no-raw-http-in-test-cases`** — No `user.get_auth()` / `post_auth()` / etc. Use domain methods
- **`no-direct-db-in-test-cases`** — No `getDatabase()`. Use domain user classes
- **`one-test-per-file`** — One exported function per file
- **`no-simple-integration-test`** — Handler must have >1 user setup call OR >1 meaningful call
- **`merge-similar-integration-tests`** — No >=95% AST-similar handlers

Helper files prefixed with `_` (e.g. `cases/_helpers.ts`) are exempt.

## Available assertions

```typescript
import {
  isDefined,
  isNotNull,
  isNull,
  isTruthy,
  isFalsy,
  isEqual,
  isNotEqual,
  isGreaterThan,
  isLowerThan,
  isGreaterThanOrEqual,
  isIncluded,
  isNotIncluded,
  hasNoDuplicates,
  hasLength,
  isNotEmpty,
  containsSameElements,
  expectToThrow,
} from "<relative>/tests/utils/assertions"
```

Pattern: `isEqual('label', actual, expected)` — throws HTTP 500 on failure, propagated to Jest.
