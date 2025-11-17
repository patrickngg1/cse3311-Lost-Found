module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'script'
  },
  rules: {
    // Enable all recommended rules for comprehensive analysis
    'no-unused-vars': 'warn',
    'no-undef': 'error',
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-alert': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-var': 'warn',
    'prefer-const': 'warn',
    'eqeqeq': 'warn',
    'curly': 'warn',
    'no-duplicate-case': 'error',
    'no-empty': 'warn',
    'no-extra-semi': 'warn',
    'no-func-assign': 'error',
    'no-irregular-whitespace': 'error',
    'no-unreachable': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error'
  },
  globals: {
    // Firebase globals
    'firebase': 'readonly',
    'auth': 'readonly',
    'db': 'readonly',
    'storage': 'readonly',
    // Service Worker globals
    'self': 'readonly',
    'caches': 'readonly',
    'fetch': 'readonly',
    'Request': 'readonly',
    'Response': 'readonly',
    'Headers': 'readonly'
  }
};
