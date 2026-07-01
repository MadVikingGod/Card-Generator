import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['dist/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      // The app is loaded as a classic <script>, not an ES module.
      sourceType: 'script',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Functions are referenced from inline onclick handlers in the HTML,
      // so ESLint can't see those uses. Only flag unused *local* bindings.
      'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none' }],
    },
  },
];
