const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "prettier",
    "turbo",
  ],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
    browser: true,
  },
  plugins: ["only-warn"],
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    // Ignore dotfiles
    ".*.js",
    "node_modules/",
    "dist/",
    ".vinxi/",
  ],
  overrides: [
    { files: ["*.js?(x)", "*.ts?(x)"] },
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        "no-undef": "off",
      },
    },
  ],
};