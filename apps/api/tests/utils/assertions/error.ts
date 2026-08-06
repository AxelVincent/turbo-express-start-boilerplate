import createHttpError from "http-errors"

export function throwAssertionFailedError(message: string, caller?: Function) {
  const error = createHttpError(500, message)
  Error.captureStackTrace(error, caller || throwAssertionFailedError)
  throw error
}

export async function expectToThrow(
  fn: () => unknown,
  expectedError?: Function | string,
) {
  let errorThrown = false
  try {
    await fn()
  } catch (error) {
    errorThrown = true
    if (typeof expectedError === "string") {
      if ((error as Error).message !== expectedError) {
        throwAssertionFailedError(
          `Expected error message "${expectedError}", got "${(error as Error).message}"`,
          expectToThrow,
        )
      }
    } else if (expectedError) {
      if ((error as Error).constructor !== expectedError) {
        throwAssertionFailedError(
          `Expected error type "${expectedError.name}", got "${(error as Error).constructor.name}"`,
          expectToThrow,
        )
      }
    }
  }
  if (!errorThrown) {
    throwAssertionFailedError(
      "Expected function to throw, but it did not",
      expectToThrow,
    )
  }
}
