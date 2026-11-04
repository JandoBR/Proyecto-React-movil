// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // Fetch-on-mount and resetting modal forms are deliberate in this app.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
