# `@repo/eslint-plugin`

Custom lint rules that encode this repo's architecture, so the conventions are
enforced mechanically instead of remembered. They are wired up by
`@repo/eslint-config` — `server.js` for the API, `start.js` for the frontend.

Run the rule tests with `pnpm --filter @repo/eslint-plugin test`.

## API architecture

| Rule                           | Severity | What it enforces                                                                                          |
| ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------- |
| `one-route-per-file`           | error    | Each handler lives in `<route>/<route>.ts` with a sibling `contract.ts` and its own `queries/`.           |
| `routes-must-use-contract`     | error    | Every handler goes through `validateRequest({...})` with schemas imported from `./contract`.              |
| `routes-wrapped-with-logger`   | error    | Handlers are wrapped in `withLogger(...)` so requests carry a request id and user context. Auto-fixable.  |
| `one-query-per-file`           | warn     | One exported query per file under `queries/`.                                                             |
| `no-inline-queries`            | error    | Kysely query builders only appear inside `queries/` (plus migrations, db setup, tests, seeds).            |
| `no-manual-query-types`        | error    | Types exported from `queries/` are derived (`Selectable<T>`, `ReturnType<typeof …>`), never hand-written. |
| `no-business-logic-in-queries` | warn     | `queries/` holds only queries — no `_helpers.ts`, no private derivations.                                 |
| `no-barrel-files`              | —        | No re-export-only modules.                                                                                |

The point of `contract.ts` is that the frontend imports the same
`z.infer<...>` types the route validates against, via the `@repo/api/*` path
alias. Schemas declared inline in a handler can't be shared and drift silently.

## Frontend architecture

| Rule                                  | Severity | What it enforces                                                                    |
| ------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `use-contract-types-in-hooks`         | error    | `apiClient<T>()` in `lib/hooks/` uses a `T` imported from a route `contract`.       |
| `prefer-shadcn-components`            | error    | Native `<input>`, `<button>`, `<table>`… give way to the `@/components/ui` version. |
| `max-component-declarations`          | error    | At most 3 components per file (off inside `components/ui/`).                        |
| `max-route-file-lines`                | error    | Route files stay under 200 lines — logic belongs in feature components.             |
| `no-dialog-in-route`                  | warn     | Dialogs live in their own component, not inline in a route.                         |
| `no-formatting-helpers-in-components` | warn     | Date/number/currency formatting belongs in `lib/format.ts`.                         |

## Integration tests

Applied to `**/*.integration.test.ts` and `**/__tests__/cases/**` via the
`integration-tests` config: `one-test-suite-per-file`,
`max-test-cases-per-suite`, `unique-routes-per-suite`,
`no-test-suite-within-describe`, `no-simple-integration-test`,
`merge-similar-integration-tests`, `forbid-test-handler-in-index-file`,
`no-commented-tests`, `skipped-test-require-ticket`,
`no-raw-http-in-test-cases`, `no-direct-db-in-test-cases`, `one-test-per-file`,
`require-given-when-then`.

## Adding a rule

1. Write `rules/<name>.js` with a `meta.docs.description` and clear
   `meta.messages` — the message is what a developer reads at 2am, so say what
   to do, not just what is wrong.
2. Write `rules/<name>.test.js` using `RuleTester`, covering the valid cases
   that could plausibly false-positive.
3. Register it in `index.js` and wire a severity in `@repo/eslint-config`.
