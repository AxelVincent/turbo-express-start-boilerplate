import "dotenv/config"

const PORT = process.env.PORT || 3035

export const API_URL = `http://localhost:${PORT}`
export const API_WEB_URL = `${API_URL}/web`
export const API_TESTS_URL = `${API_URL}/apitests`

export const HEADERS_AUTH = {
  authorization: process.env.HEALTH_AUTH_TOKEN || "test-secret",
}
