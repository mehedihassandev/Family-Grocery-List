const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    ignores: [
      "android/**",
      "ios/**",
      ".expo/**",
      "backend/.venv/**",
      "backend/.pytest_cache/**",
      "backend/.ruff_cache/**",
      "backend/**/__pycache__/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      "scripts/**",
    ],
  },
]);
