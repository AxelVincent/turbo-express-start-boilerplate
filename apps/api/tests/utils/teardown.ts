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
  await Promise.allSettled([storeTestCoverage(), showUsersCreatedCount()])
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

async function showUsersCreatedCount() {
  try {
    const { data } = await axios.get(`${API_URL}/apitests/users_created`, {
      headers: HEADERS,
      timeout: 10000,
    })
    const count = data?.count || 0
    if (count > 0) {
      console.log(`${count} test user(s) were created during this run.`)
    }
  } catch {
    // Stats collection is optional
  }
}
