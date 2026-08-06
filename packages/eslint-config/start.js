/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["eslint:recommended", "prettier", "turbo"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
    browser: true,
  },
  plugins: ["@typescript-eslint", "@repo"],
  ignorePatterns: [
    // Ignore dotfiles
    ".*.js",
    "node_modules/",
    "dist/",
    ".vinxi/",
    // Linted by the api workspace with its own (node) preset.
    "../api/**",
  ],
  rules: {
    // Keep components small enough to read in one screen and force shared
    // pieces out into their own files instead of stacking up in one module.
    "@repo/max-component-declarations": ["error", { max: 3 }],
    "@repo/no-formatting-helpers-in-components": "warn",
    // Hooks must consume the inferred types the route validates against, so
    // the wire format can't drift between client and server.
    "@repo/use-contract-types-in-hooks": "error",
    "@repo/prefer-shadcn-components": "error",
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        "no-undef": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
      },
    },
    {
      // The shadcn primitives necessarily render the native elements and
      // export several components per file.
      files: ["src/components/ui/**/*.tsx"],
      rules: {
        "@repo/max-component-declarations": "off",
        "@repo/prefer-shadcn-components": "off",
      },
    },
    {
      // Route files wire things together; anything substantial belongs in a
      // feature component so it can be reused and tested.
      files: ["src/routes/**/*.tsx"],
      rules: {
        "@repo/max-route-file-lines": ["error", { max: 200 }],
        "@repo/no-dialog-in-route": "warn",
      },
    },
  ],
}
