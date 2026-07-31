const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    settings: {
      react: {
        version: "19.2",
      },
    },
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/static-components": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
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
