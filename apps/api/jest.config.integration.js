const baseConfig = require("./node_modules/@repo/jest-presets/node/jest-preset")

const isCI = !!process.env.CI_RUN_ID

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,

  // Only run integration test files
  testMatch: ["**/*.integration.test.ts"],

  // Module name mapping for path aliases used in source code
  moduleNameMapper: {
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@external/(.*)$": "<rootDir>/src/external/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@queues/(.*)$": "<rootDir>/src/queues/$1",
  },

  reporters: !isCI
    ? ["default"]
    : [
        "default",
        [
          "jest-junit",
          {
            titleTemplate: "{title}",
            classNameTemplate: "{classname}",
            suiteNameTemplate: ({ filename }) => filename,
          },
        ],
      ],

  // Mocks applied before each test file
  setupFilesAfterEnv: ["<rootDir>/tests/utils/setup.ts"],

  // Runs once before all test files — seeds users
  globalSetup: "<rootDir>/tests/user/seed.ts",

  // Runs once after all test files — collects coverage/metrics
  globalTeardown: "<rootDir>/tests/utils/teardown.ts",

  testPathIgnorePatterns: [...baseConfig.modulePathIgnorePatterns],

  // Longer timeout for integration tests (30s default)
  testTimeout: 30000,
}
