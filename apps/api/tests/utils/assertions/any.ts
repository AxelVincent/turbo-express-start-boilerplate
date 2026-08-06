import { throwAssertionFailedError } from "./error"

export function isDefined<T>(value: T | undefined): asserts value is T {
  if (value === undefined) {
    throwAssertionFailedError("expected value to be defined", isDefined)
  }
}

export function isNotNull<T>(value: T | null): asserts value is T {
  if (value === null) {
    throwAssertionFailedError("expected value to not be null", isNotNull)
  }
}

export function isNull(value: unknown): asserts value is null {
  if (value !== null) {
    throwAssertionFailedError(
      `expected null, got ${JSON.stringify(value)}`,
      isNull,
    )
  }
}

export function isTruthy(label: string, value: unknown): void {
  if (!value) {
    throwAssertionFailedError(
      `${label}: expected truthy value, got ${JSON.stringify(value)}`,
      isTruthy,
    )
  }
}

export function isFalsy(label: string, value: unknown): void {
  if (value) {
    throwAssertionFailedError(
      `${label}: expected falsy value, got ${JSON.stringify(value)}`,
      isFalsy,
    )
  }
}
