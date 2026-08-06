import "dotenv/config"
import axios from "axios"

const API_URL = `http://localhost:${process.env.PORT || 3035}`
const AUTH_TOKEN = process.env.HEALTH_AUTH_TOKEN || "test-secret"

export default async function globalSetup() {
  console.log("\n🔧 Seeding test users...")

  try {
    await axios.post(
      `${API_URL}/apitests/seed_users`,
      {},
      {
        headers: { authorization: AUTH_TOKEN },
        timeout: 60000,
      },
    )
    console.log("✅ Test users seeded.\n")
  } catch (error: any) {
    const message = error.response?.data?.message || error.message
    console.error(`❌ Failed to seed test users: ${message}`)
    console.error(
      "Make sure the API server is running before running integration tests.",
    )
    console.error(`Expected server at: ${API_URL}`)
    process.exit(1)
  }
}
