module.exports = {
  extends: ["eslint:recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "@repo"],
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@repo/one-query-per-file": "warn",
  },
  overrides: [
    {
      files: ["**/__tests__/**/*"],
      env: {
        jest: true,
      },
    },
    {
      files: ["**/*.integration.test.ts"],
      rules: {
        "@repo/one-test-suite-per-file": "error",
        "@repo/max-test-cases-per-suite": ["error", { max: 10 }],
        "@repo/unique-routes-per-suite": "error",
        "@repo/no-test-suite-within-describe": "error",
        "@repo/no-simple-integration-test": "error",
        "@repo/merge-similar-integration-tests": "error",
        "@repo/no-commented-tests": "error",
        "@repo/skipped-test-require-ticket": "error",
      },
    },
    {
      files: ["**/__tests__/cases/**/*"],
      rules: {
        "@repo/forbid-test-handler-in-index-file": "error",
        "@repo/no-raw-http-in-test-cases": "error",
        "@repo/no-direct-db-in-test-cases": "error",
        "@repo/one-test-per-file": "error",
        "@repo/require-given-when-then": "error",
      },
    },
  ],
}
