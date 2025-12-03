/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/server.js"],
  ignorePatterns: ["**/__tests__/"],
  rules: {
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
};
