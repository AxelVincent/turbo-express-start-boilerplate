import { randomUUID as uuid } from "crypto"

export const enrichHeaders = (
  headers: Record<string, string>,
): Record<string, string> => {
  const copy = { ...headers }
  const id = uuid()

  // Unique user-agent per request prevents rate limiting
  copy["user-agent"] ||= `boilerplate.test-${id}`

  // Unique device/client ID
  copy["x-device-id"] ||= id

  // Fake IP for testing
  copy["X-Forwarded-For"] ||= "127.0.0.1"

  return copy
}
