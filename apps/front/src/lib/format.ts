/**
 * Shared display formatters. The `no-formatting-helpers-in-components` lint
 * rule points components here so the same value never renders two ways in two
 * places. Add to this file rather than defining a `fmt` object in a component.
 */

const DEFAULT_LOCALE = undefined // follow the browser's locale

export function formatDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString(DEFAULT_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString(DEFAULT_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** "3 minutes ago", "in 2 days" — falls back to an absolute date past a week. */
export function formatRelativeTime(value: string | number | Date): string {
  const then = new Date(value).getTime()
  const deltaMs = then - Date.now()
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["second", 1000],
    ["minute", 60 * 1000],
    ["hour", 60 * 60 * 1000],
    ["day", 24 * 60 * 60 * 1000],
  ]

  if (Math.abs(deltaMs) >= 7 * 24 * 60 * 60 * 1000) return formatDate(value)

  const formatter = new Intl.RelativeTimeFormat(DEFAULT_LOCALE, {
    numeric: "auto",
  })
  let [unit, ms] = units[0]
  for (const [candidateUnit, candidateMs] of units) {
    if (Math.abs(deltaMs) >= candidateMs)
      [unit, ms] = [candidateUnit, candidateMs]
  }
  return formatter.format(Math.round(deltaMs / ms), unit)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE).format(value)
}

/** Compact form for dense UI: 1.2K, 3.4M. */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
  }).format(value)
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "percent",
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"]

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const exponent = Math.min(
    Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  )
  const value = bytes / Math.pow(1024, exponent)
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${BYTE_UNITS[exponent]}`
}

export function formatDuration(ms: number): string {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}
