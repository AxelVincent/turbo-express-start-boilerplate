"use strict"

module.exports = {
  rules: {
    "one-query-per-file": require("./rules/one-query-per-file"),
    "no-barrel-files": require("./rules/no-barrel-files"),
    "one-test-suite-per-file": require("./rules/one-test-suite-per-file"),
    "max-test-cases-per-suite": require("./rules/max-test-cases-per-suite"),
    "unique-routes-per-suite": require("./rules/unique-routes-per-suite"),
    "no-test-suite-within-describe": require("./rules/no-test-suite-within-describe"),
    "no-simple-integration-test": require("./rules/no-simple-integration-test"),
    "merge-similar-integration-tests": require("./rules/merge-similar-integration-tests"),
    "forbid-test-handler-in-index-file": require("./rules/forbid-test-handler-in-index-file"),
    "no-commented-tests": require("./rules/no-commented-tests"),
    "skipped-test-require-ticket": require("./rules/skipped-test-require-ticket"),
    "no-raw-http-in-test-cases": require("./rules/no-raw-http-in-test-cases"),
    "no-direct-db-in-test-cases": require("./rules/no-direct-db-in-test-cases"),
    "one-test-per-file": require("./rules/one-test-per-file"),
    "require-given-when-then": require("./rules/require-given-when-then"),
  },
  configs: {
    "integration-tests": {
      plugins: ["@repo"],
      rules: {
        "@repo/one-test-suite-per-file": "error",
        "@repo/max-test-cases-per-suite": ["error", { max: 10 }],
        "@repo/unique-routes-per-suite": "error",
        "@repo/no-test-suite-within-describe": "error",
        "@repo/no-simple-integration-test": "error",
        "@repo/merge-similar-integration-tests": "error",
        "@repo/forbid-test-handler-in-index-file": "error",
        "@repo/no-commented-tests": "error",
        "@repo/skipped-test-require-ticket": "error",
        "@repo/no-raw-http-in-test-cases": "error",
        "@repo/no-direct-db-in-test-cases": "error",
        "@repo/one-test-per-file": "error",
        "@repo/require-given-when-then": "error",
      },
    },
  },
}
