import "dotenv/config"
import axios from "axios"

const API_URL = `http://localhost:${process.env.PORT || 3035}`

export default async function globalSetup() {
  try {
    await axios.get(`${API_URL}/health`, { timeout: 10000 })
  } catch {
    console.error("❌ Could not reach the API server before running integration tests.")
    console.error(`Expected server at: ${API_URL}`)
    process.exit(1)
  }
}
