import { throwAssertionFailedError } from "./error"

export const isEqual = <T>(
  label: string,
  actual: T | null | undefined,
  expected: T,
  context?: unknown,
) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throwAssertionFailedError(
      `${label}: ${JSON.stringify(actual)} (actual) is not equal to ` +
        `${JSON.stringify(expected)} (expected)` +
        (context ? `, context: ${JSON.stringify(context)}` : ""),
      isEqual,
    )
  }
}

export const isNotEqual = <T>(label: string, actual: T, expected: T) => {
  if (actual === expected) {
    throwAssertionFailedError(
      `${label}: ${JSON.stringify(actual)} should not equal ${JSON.stringify(expected)}`,
      isNotEqual,
    )
  }
}

export const isGreaterThan = (
  label: string,
  actual: number | null | undefined,
  expected: number,
) => {
  if (typeof actual !== "number" || actual <= expected) {
    throwAssertionFailedError(
      `${label}: ${actual} is not greater than ${expected}`,
      isGreaterThan,
    )
  }
}

export const isLowerThan = (
  label: string,
  actual: number | null | undefined,
  expected: number,
) => {
  if (typeof actual !== "number" || actual >= expected) {
    throwAssertionFailedError(
      `${label}: ${actual} is not lower than ${expected}`,
      isLowerThan,
    )
  }
}

export const isGreaterThanOrEqual = (
  label: string,
  actual: number | null | undefined,
  expected: number,
) => {
  if (typeof actual !== "number" || actual < expected) {
    throwAssertionFailedError(
      `${label}: ${actual} is not greater than or equal to ${expected}`,
      isGreaterThanOrEqual,
    )
  }
}
