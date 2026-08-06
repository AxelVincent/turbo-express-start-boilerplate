/**
 * Opaque cursors for keyset pagination. The payload is only base64url-encoded,
 * not signed — treat a decoded cursor as untrusted input and validate it the
 * same way you would a query parameter.
 */
export function encodeCursor(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url")
}

export function decodeCursor<T>(raw: string): T | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString()) as T
  } catch {
    return null
  }
}
