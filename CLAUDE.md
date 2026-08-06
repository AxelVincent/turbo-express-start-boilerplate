# Project conventions

## Code style

- Less is more. Prefer the smallest change that solves the problem.
- No comments unless a non-obvious WHY is required. Never narrate WHAT.
- No defensive code, fallbacks, or validation for cases that can't happen.
- No premature abstractions, helpers, or "future-proofing".
- Validate with `pnpm typecheck` and `pnpm lint`. Don't run `pnpm dev` /
  `pnpm build` — they're usually already running.
- Reference code as `path:line`; don't paste file contents back.

## Architecture is lint-enforced

`@repo/eslint-plugin` turns the conventions below into errors, so read its
README before working around one. `pnpm lint` runs with `--max-warnings 0`:
a warn-level rule is as blocking as an error, which is deliberate — drift is
the thing this boilerplate exists to prevent.

## API routes

One handler per folder, mirroring its URL:

```
routes_web/users/get_user/
  get_user.ts     # the router — a single router.<method>() call
  contract.ts     # zod schemas + inferred types
  queries/        # the queries this route uses, one per file
```

- Every handler goes through `validateRequest({...})` with schemas imported
  from the sibling `contract.ts`, never declared inline. The frontend imports
  those same inferred types via `@repo/api/routes_web/<route>/contract`, which
  is what keeps client and server in sync.
- Wrap handlers in `withLogger(...)` so the request carries a request id and
  user context into the logs.
- `index.ts` files only mount sub-routers with `router.use(...)`.

Four route surfaces, by caller:

| Path        | Caller                | Auth                            |
| ----------- | --------------------- | ------------------------------- |
| `/public`   | anyone                | none — treat input as hostile   |
| `/webhook`  | third-party providers | each route verifies a signature |
| `/web`      | the signed-in user    | session cookie                  |
| `/internal` | our own services      | `INTERNAL_RPC_SECRET`           |

## Database

- Query builders (`selectFrom`, `insertInto`, …) only appear inside a
  `queries/` folder — one exported query per file, no private helpers, no
  shared derivations. Business logic belongs in the calling service.
- Types exported from `queries/` are derived (`Selectable<T>`,
  `ReturnType<typeof …>`), never hand-written object shapes.
- Access the database with `getDatabase()` from `db/database`, called inside
  the function. Never instantiate a new `Kysely` client.

When you add a migration:

1. Name it `NNN_short_description.ts` in `apps/api/src/db/migrations/` —
   zero-padded, sequential after the highest existing number.
2. Run `pnpm db:migrate`
3. Run `pnpm db:types`

Never hand-write Kysely types — they are generated into
`apps/api/src/db/types.ts`.

## Frontend

- Route files stay under 200 lines and only wire things together. Anything
  substantial goes in `components/features/<feature>/`, at most 3 components
  per file.
- Hooks in `lib/hooks/` call `apiClient<T>()` with a `T` imported from a route
  contract — never an inline shape.
- Use the `@/components/ui` primitives rather than native `<input>`,
  `<button>`, `<table>`… `npx shadcn@latest add <name>` to add one.
- Destructive actions use `useConfirm()` rather than a hand-rolled dialog.
- Display formatting lives in `lib/format.ts`.

## Path aliases

`apps/api`: `@services/*`, `@external/*`, `@lib/*`, `@queues/*`. Everything
else (`db`, `middlewares`, `routes_web`, …) uses relative imports.

`apps/front`: `@/*` for its own source, `@repo/api/*` to reach API contracts.

## Observability

Logs go through `@repo/logger` with a `{ msg, event, metadata }` payload —
`event` is what you filter on in Loki. Outside development every
`logger.error` also posts to Slack, so don't use it for expected conditions.
Traces export to Tempo; `docker-compose up -d` brings up the whole stack.

## Before committing

Run `pnpm format` so Prettier rewrites land in the commit rather than dangling
in the working tree.
