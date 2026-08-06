import "dotenv/config"
import { existsSync } from "fs"
import { mkdir, writeFile } from "fs/promises"
import { resolve } from "path"
import axios from "axios"

const API_URL = `http://localhost:${process.env.PORT || 3035}`
const HEADERS = {
  authorization: process.env.HEALTH_AUTH_TOKEN || "test-secret",
}

export default async function globalTeardown() {
  await Promise.allSettled([storeTestCoverage(), showAdditionalUsersCount()])
}

async function storeTestCoverage() {
  try {
    const { data } = await axios.get(`${API_URL}/apitests/coverage`, {
      headers: HEADERS,
      timeout: 10000,
    })

    if (!data?.coverage) return

    const coveragePath = resolve(process.cwd(), "coverage")
    if (!existsSync(coveragePath)) await mkdir(coveragePath)

    await writeFile(
      resolve(coveragePath, "coverage-final.json"),
      JSON.stringify(data.coverage),
    )
    console.log("Coverage data stored.")
  } catch {
    // Coverage collection is optional
  }
}

async function showAdditionalUsersCount() {
  try {
    const { data } = await axios.get(`${API_URL}/apitests/additional_users`, {
      headers: HEADERS,
      timeout: 10000,
    })
    const count = data?.count || 0
    if (count > 0) {
      console.log(
        `${count} additional test user(s) were created beyond the seeded pool.`,
      )
    }
  } catch {
    // Stats collection is optional
  }
}
