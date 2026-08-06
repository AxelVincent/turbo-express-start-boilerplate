import { throwAssertionFailedError } from "./error"

export const isIncluded = <T>(label: string, array: T[], element: T) => {
  if (!array.includes(element)) {
    throwAssertionFailedError(
      `${label}: ${JSON.stringify(element)} not found in array`,
      isIncluded,
    )
  }
}

export const isNotIncluded = <T>(label: string, array: T[], element: T) => {
  if (array.includes(element)) {
    throwAssertionFailedError(
      `${label}: ${JSON.stringify(element)} should not be in array`,
      isNotIncluded,
    )
  }
}

export const hasNoDuplicates = <T>(label: string, values: T[]) => {
  const unique = new Set(values)
  if (unique.size !== values.length) {
    throwAssertionFailedError(
      `${label}: array has duplicates (${values.length} items, ${unique.size} unique)`,
      hasNoDuplicates,
    )
  }
}

export const hasLength = (
  label: string,
  array: unknown[],
  expectedLength: number,
) => {
  if (array.length !== expectedLength) {
    throwAssertionFailedError(
      `${label}: expected length ${expectedLength}, got ${array.length}`,
      hasLength,
    )
  }
}

export const isNotEmpty = (label: string, array: unknown[]) => {
  if (array.length === 0) {
    throwAssertionFailedError(`${label}: expected non-empty array`, isNotEmpty)
  }
}

export const containsSameElements = <T>(
  label: string,
  actual: T[],
  expected: T[],
) => {
  const sortedActual = JSON.stringify([...actual].sort())
  const sortedExpected = JSON.stringify([...expected].sort())
  if (sortedActual !== sortedExpected) {
    throwAssertionFailedError(
      `${label}: arrays do not contain the same elements.\n` +
        `  actual:   ${sortedActual}\n` +
        `  expected: ${sortedExpected}`,
      containsSameElements,
    )
  }
}
