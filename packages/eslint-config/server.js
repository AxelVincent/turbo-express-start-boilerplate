// Vendor SDKs are wrapped once under external/; everything else imports the
// adapter, so swapping a provider stays a one-folder change.
const SDK_MESSAGE =
  "Vendor SDKs are wrapped in an adapter under src/external/ — import that instead."

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
    // The TS-aware variant: the base rule flags parameters in declaration-only
    // signatures (interface methods, overloads), which forced eslint-disable
    // pragmas on every provider interface.
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    // Data access: one query per file, no query builders outside queries/,
    // and query types derived from the generated DB types rather than
    // hand-written shapes that silently drift from the schema.
    "@repo/one-query-per-file": "warn",
    "@repo/no-inline-queries": "error",
    "@repo/no-manual-query-types": "error",
    "@repo/no-business-logic-in-queries": "warn",
    // Route layout: each handler in its own folder with a colocated
    // contract.ts, so the frontend can import the same inferred types.
    "@repo/routes-must-use-contract": "error",
    "@repo/one-route-per-file": "error",
    "no-restricted-imports": [
      "error",
      {
        paths: [{ name: "resend", message: SDK_MESSAGE }],
        // Patterns with a slash are anchored; a bare "resend" pattern would
        // use gitignore semantics and also match "../../config/resend".
        patterns: [{ group: ["resend/*", "@aws-sdk/*"], message: SDK_MESSAGE }],
      },
    ],
  },
  overrides: [
    {
      files: ["**/__tests__/**/*"],
      env: {
        jest: true,
      },
    },
    {
      // Adapters (and tests) are the one place vendor SDKs are imported
      // directly.
      files: ["**/external/**", "**/__tests__/**/*", "**/*.test.*"],
      rules: { "no-restricted-imports": "off" },
    },
    {
      // Every request-handling surface runs inside a logger context, so
      // requests carry a request id and user fields through to the logs.
      files: [
        "**/routes_web/**/*.ts",
        "**/routes_public/**/*.ts",
        "**/routes_webhook/**/*.ts",
        "**/routes_internal/**/*.ts",
      ],
      rules: {
        "@repo/routes-wrapped-with-logger": "error",
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
