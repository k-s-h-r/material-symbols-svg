module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      rules: {
        'no-unused-vars': 'off', // TypeScript handles this
        'no-undef': 'off', // TypeScript handles this
      },
    },
    {
      files: ['scripts/**/*.js', 'scripts/**/*.cjs', '*.config.*'],
      env: {
        node: true,
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.d.ts',
    'packages/*/src/icons/',
    'packages/*/src/metadata/',
  ],
};