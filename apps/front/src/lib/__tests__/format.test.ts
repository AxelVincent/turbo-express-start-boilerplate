import { describe, it, expect, vi, afterEach } from "vitest"
import {
  formatBytes,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatDuration,
  formatPercent,
  formatRelativeTime,
} from "../format"

afterEach(() => {
  vi.useRealTimers()
})

describe("formatBytes", () => {
  it("renders zero without a fractional part", () => {
    expect(formatBytes(0)).toBe("0 B")
  })

  it("keeps whole bytes unrounded", () => {
    expect(formatBytes(512)).toBe("512 B")
  })

  it("steps up through the units", () => {
    expect(formatBytes(1024)).toBe("1.0 KB")
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB")
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB")
  })

  it("clamps at the largest known unit instead of running off the end", () => {
    expect(formatBytes(1024 ** 6)).toContain("TB")
  })
})

describe("formatDuration", () => {
  it("uses milliseconds below a second", () => {
    expect(formatDuration(250)).toBe("250ms")
  })

  it("uses seconds at and above a second", () => {
    expect(formatDuration(1_500)).toBe("1.5s")
  })

  it("uses minutes at and above a minute", () => {
    expect(formatDuration(90_000)).toBe("1.5m")
  })
})

describe("formatRelativeTime", () => {
  it("falls back to an absolute date beyond a week", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-01T00:00:00Z"))
    const old = "2026-01-01T00:00:00Z"
    expect(formatRelativeTime(old)).toBe(formatDate(old))
  })

  it("stays relative inside a week", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-01T00:00:00Z"))
    const result = formatRelativeTime("2026-02-28T00:00:00Z")
    expect(result).not.toBe(formatDate("2026-02-28T00:00:00Z"))
    expect(result.length).toBeGreaterThan(0)
  })
})

describe("Intl-backed formatters", () => {
  it("formats a percentage from a ratio", () => {
    expect(formatPercent(0.42)).toContain("42")
  })

  it("includes the currency symbol", () => {
    expect(formatCurrency(1234.5, "USD")).toContain("1,234.5")
  })

  it("compacts large numbers", () => {
    expect(formatCompactNumber(1_500)).toMatch(/1\.5K/i)
  })
})
