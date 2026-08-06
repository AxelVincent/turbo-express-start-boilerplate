import { jest, describe, it, expect, afterAll } from "@jest/globals"
import { randomUUID as uuid } from "crypto"
import axios from "axios"
import { API_TESTS_URL, HEADERS_AUTH } from "./constants"
import { enrichHeaders } from "./headers"
import { testMessage, describeMessage } from "./helpers"

// ------- Types -------

export type TestCase = {
  /** Scenario description, e.g. "a user creates an agent" */
  when: string
  /** Expected result, e.g. "the agent appears in their list" */
  then: string
  /** Route suffix appended to routePrefix, e.g. "create_and_list" */
  route: string
  /** Skip auth headers (for public endpoints) */
  noAuth?: boolean
  /** Control execution: 'skip' | 'only' */
  modifier?: "skip" | "only"
  /** Run concurrently. Default: true */
  concurrent?: boolean
  /** Custom timeout in ms */
  timeout?: number
  /** POST body — if present, uses POST instead of GET */
  body?: unknown
}

type SuiteOptions = {
  name: string
  routePrefix?: string
  allowEmpty?: boolean
}

// ------- Helpers -------

class TestError extends Error {
  constructor(message: string, cause: Error) {
    super(message)
    this.stack = cause.stack
      ? `${this.message}\n${cause.stack.split("\n").slice(1).join("\n")}`
      : this.message
  }
}

function resolveHttpMethod(
  headers: Record<string, string>,
  noAuth?: boolean,
  body?: unknown,
) {
  const authHeaders = noAuth ? {} : HEADERS_AUTH
  const allHeaders = enrichHeaders({ ...headers, ...authHeaders })

  if (body) {
    return async (path: string) => {
      const url = `${API_TESTS_URL}${path}`.replace(/(?<!:)\/+/g, "/")
      return axios.request({
        method: "POST",
        url,
        data: body,
        headers: { "Content-Type": "application/json", ...allHeaders },
      })
    }
  }

  return async (path: string) => {
    const url = `${API_TESTS_URL}${path}`.replace(/(?<!:)\/+/g, "/")
    return axios.request({
      method: "GET",
      url,
      headers: allHeaders,
    })
  }
}

async function unlockAllUsers(headers: Record<string, string>) {
  await axios
    .post(
      `${API_TESTS_URL}/unlock_users`,
      {},
      { headers: { ...HEADERS_AUTH, ...headers } },
    )
    .catch(() => {
      // Ignore errors during cleanup
    })
}

// ------- Main Factory -------

export function createIntegrationTestSuite(
  { name, routePrefix, allowEmpty }: SuiteOptions,
  ...testCases: TestCase[]
) {
  // Each suite gets a unique key for user isolation
  const userSeedKey = uuid()
  const headers = { "x-test-user-seed": userSeedKey }

  // Release all locked users after this suite finishes
  afterAll(async () => {
    await unlockAllUsers(headers)
  })

  describe(describeMessage(name), () => {
    // Retry in CI
    if (process.env.CI_RUN_ID) {
      jest.retryTimes(3, { logErrorsBeforeRetry: true })
    }

    if (testCases.length === 0 && allowEmpty) {
      it.todo("Empty test suite placeholder")
      return
    }

    for (const {
      when,
      then,
      route,
      noAuth,
      modifier,
      concurrent,
      timeout,
      body,
    } of testCases) {
      // Select it / it.skip / it.only / it.concurrent
      const itFunc =
        modifier === "skip"
          ? it.skip
          : modifier === "only"
            ? it.only
            : (concurrent ?? true)
              ? it.concurrent
              : it

      itFunc(
        testMessage({ when, then }),
        async () => {
          expect.hasAssertions()
          const handle = resolveHttpMethod(headers, noAuth, body)
          const fullRoute = `${routePrefix ?? ""}/${route}`.replace(
            /\/{2,}/g,
            "/",
          )

          try {
            const response = await handle(fullRoute)
            expect(response.status).toBe(200)
          } catch (error: any) {
            const errData = error.response?.data
            const details = errData?.message
              ? String(errData.message).trim()
              : ""
            const serverStack = errData?.stack

            if (details || serverStack) {
              throw new TestError(
                `Test failed: ${details || error.message}`,
                serverStack
                  ? ({ message: details, stack: serverStack } as Error)
                  : error,
              )
            }

            // Re-throw original error if no server details
            expect(error.response?.status).toBe(200)
          }
        },
        timeout,
      )
    }
  })
}
