import { Router, type Request, type Response } from "express"
import { sync as globSync } from "fast-glob"
import { resolve } from "path"

const router = Router()

// Endpoint: seed test users
router.post("/seed_users", async (req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { userManager } = require("../../tests/utils/user")
    const count = req.body?.count || 30
    await userManager.seed(count)
    res.json({ success: true, count })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

// Endpoint: unlock test users for a group
router.post("/unlock_users", async (req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { userManager } = require("../../tests/utils/user")
    const groupName = req.body?.groupName
    if (groupName) {
      await userManager.unlockAllUsers(groupName)
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

// Endpoint: get count of additionally created users
router.get("/additional_users", async (_req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { userManager } = require("../../tests/utils/user")
    res.json({ count: userManager.newUsers ?? 0 })
  } catch (error) {
    res.json({ count: 0 })
  }
})

// Endpoint: retrieve code coverage from the global __coverage__ object
router.get("/coverage", (_req: Request, res: Response) => {
  const field = "__coverage__" as keyof typeof global
  res.json({ coverage: (global as any)[field] || null })
})

// Dynamically register all test case routers
registerTestRoutes(router)

function registerTestRoutes(parentRouter: Router) {
  const basePath = resolve(process.cwd(), "src/routes_web")
  const paths = globSync(`${basePath}/**/__tests__/cases/index.ts`)

  for (const path of paths) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { default: routerDefinition } = require(path)

      if (!Array.isArray(routerDefinition)) {
        console.error(
          `[TEST] Test router at ${path} does not export expected format [basePath, ...routers].`,
        )
        continue
      }

      const [testPath, ...testCaseRouters] = routerDefinition

      for (const testCaseRouter of testCaseRouters) {
        parentRouter.use(testPath, testCaseRouter)
      }

      console.log(`[TEST] Registered test routes: ${testPath} (from ${path})`)
    } catch (error) {
      console.error(
        `[TEST] Failed to load test router at ${path}:`,
        (error as Error).message,
      )
    }
  }
}

export default router
