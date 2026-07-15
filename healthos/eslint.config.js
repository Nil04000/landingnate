const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const pluginQuery = require('@tanstack/eslint-plugin-query');

module.exports = defineConfig([
  expoConfig,
  pluginQuery.configs['flat/recommended'],
  {
    ignores: ['dist/**', 'src/core/db/migrations/**'],
  },
]);
