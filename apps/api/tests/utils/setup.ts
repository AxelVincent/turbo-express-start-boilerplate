import { jest } from "@jest/globals"

// Retry flaky tests in CI
if (process.env.CI_RUN_ID) {
  jest.retryTimes(3, { logErrorsBeforeRetry: true })
}
