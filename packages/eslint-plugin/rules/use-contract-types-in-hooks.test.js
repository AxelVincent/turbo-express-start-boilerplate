"use strict"

const { RuleTester } = require("eslint")
const rule = require("./use-contract-types-in-hooks")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
})

const HOOK_FILE = "/repo/apps/front/src/lib/hooks/use-clients.ts"
const NON_HOOK_FILE = "/repo/apps/front/src/components/foo.tsx"

ruleTester.run("use-contract-types-in-hooks", rule, {
  valid: [
    // ── apiClient<T>() with T imported from a route contract ──
    {
      filename: HOOK_FILE,
      code: `
        import type { GetClientResponse } from '@repo/api/routes_web/org/clients/get_client/contract'
        function useClient(id: string) {
          return apiClient<GetClientResponse>(\`/web/clients/\${id}\`)
        }
      `,
    },
    // ── Mixed value+type imports from contract ──
    {
      filename: HOOK_FILE,
      code: `
        import { type CreateClientInput, type CreateClientResponse } from '@repo/api/routes_web/org/clients/add_client/contract'
        function useCreateClient() {
          return useMutation({
            mutationFn: (input: CreateClientInput) =>
              apiClient<CreateClientResponse>('/web/clients', { method: 'POST', body: input }),
          })
        }
      `,
    },
    // ── apiClient() with no type argument is allowed (DELETE / void) ──
    {
      filename: HOOK_FILE,
      code: `
        function useDeleteClient() {
          return useMutation({
            mutationFn: (id: string) => apiClient(\`/web/clients/\${id}\`, { method: 'DELETE' }),
          })
        }
      `,
    },
    // ── mutationFn with primitive param type is fine ──
    {
      filename: HOOK_FILE,
      code: `
        import type { CreateClientResponse } from '@repo/api/routes_web/org/clients/add_client/contract'
        function useFoo() {
          return useMutation({
            mutationFn: (id: string | null) => apiClient<CreateClientResponse>('/x', { method: 'POST', body: { id } }),
          })
        }
      `,
    },
    // ── mutationFn whose body does NOT call apiClient is ignored ──
    {
      filename: HOOK_FILE,
      code: `
        function useThing() {
          return useMutation({
            mutationFn: (input: { foo: string }) => doSomethingElse(input),
          })
        }
      `,
    },
    // ── routes_tests contract path is also accepted ──
    {
      filename: HOOK_FILE,
      code: `
        import type { TestResponse } from '@repo/api/routes_tests/foo/contract'
        function useThing() {
          return apiClient<TestResponse>('/x')
        }
      `,
    },
    // ── Files outside lib/hooks/ are not checked ──
    {
      filename: NON_HOOK_FILE,
      code: `
        type LocalShape = { id: string }
        function f() {
          return apiClient<LocalShape>('/x')
        }
      `,
    },
    {
      filename: NON_HOOK_FILE,
      code: `
        function f() {
          return apiClient<{ items: number[] }>('/x')
        }
      `,
    },
  ],

  invalid: [
    // ── Inline object type literal as response type ──
    {
      filename: HOOK_FILE,
      code: `
        function useFoo() {
          return apiClient<{ items: number[] }>('/web/foo')
        }
      `,
      errors: [{ messageId: "inlineLiteral" }],
    },
    // ── Array of locally-defined type ──
    {
      filename: HOOK_FILE,
      code: `
        type LocalAd = { id: string }
        function useFoo() {
          return apiClient<LocalAd[]>('/web/foo')
        }
      `,
      errors: [{ messageId: "inlineLiteral" }],
    },
    // ── Type imported from a non-contract module ──
    {
      filename: HOOK_FILE,
      code: `
        import type { SomeShape } from './local-types'
        function useFoo() {
          return apiClient<SomeShape>('/web/foo')
        }
      `,
      errors: [{ messageId: "notFromContract", data: { name: "SomeShape" } }],
    },
    // ── Type imported from @repo/api but not a contract path ──
    {
      filename: HOOK_FILE,
      code: `
        import type { SharedThing } from '@repo/api/types/shared'
        function useFoo() {
          return apiClient<SharedThing>('/web/foo')
        }
      `,
      errors: [{ messageId: "notFromContract", data: { name: "SharedThing" } }],
    },
    // ── Locally-declared identifier (no import at all) ──
    {
      filename: HOOK_FILE,
      code: `
        type Thing = string
        function useFoo() {
          return apiClient<Thing>('/web/foo')
        }
      `,
      errors: [{ messageId: "notFromContract", data: { name: "Thing" } }],
    },
    // ── Union of types is not a single contract reference ──
    {
      filename: HOOK_FILE,
      code: `
        import type { A } from '@repo/api/routes_web/x/contract'
        import type { B } from '@repo/api/routes_web/y/contract'
        function useFoo() {
          return apiClient<A | B>('/web/foo')
        }
      `,
      errors: [{ messageId: "inlineLiteral" }],
    },
    // ── mutationFn input typed as inline object shape ──
    {
      filename: HOOK_FILE,
      code: `
        import type { Resp } from '@repo/api/routes_web/x/contract'
        function useFoo() {
          return useMutation({
            mutationFn: (input: { metaAdId: string; status?: string }) =>
              apiClient<Resp>('/x', { method: 'POST', body: input }),
          })
        }
      `,
      errors: [{ messageId: "mutationInputLiteral" }],
    },
    // ── Both apiClient type and mutation input are violations ──
    {
      filename: HOOK_FILE,
      code: `
        function useFoo() {
          return useMutation({
            mutationFn: (input: { id: string }) =>
              apiClient<{ ok: true }>('/x', { method: 'POST', body: input }),
          })
        }
      `,
      errors: [
        { messageId: "mutationInputLiteral" },
        { messageId: "inlineLiteral" },
      ],
    },
  ],
})

console.log("use-contract-types-in-hooks: all tests passed")
