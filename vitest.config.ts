/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: [
      'tests/scripts/unit/*.{test,spec}.{js,ts}',
      'scripts/**/*.{test,spec}.{js,ts}'
    ],
    exclude: [
      'node_modules',
      'packages',
      'dist',
      'coverage',
      'tests/scripts/integration' // Exclude integration tests due to process.chdir() limitations
    ],
    coverage: {
      include: ['scripts/**/*.{js,cjs}'],
      exclude: [
        'scripts/**/*.test.{js,cjs}',
        'scripts/**/*.spec.{js,cjs}',
        'scripts/dev-icons.js'
      ],
      reporter: ['text', 'lcov', 'html']
    },
    testTimeout: 30000,
    pool: 'forks', // Use forks instead of threads to allow process.chdir()
    poolOptions: {
      forks: {
        singleFork: true // Use single fork for better compatibility
      }
    }
  }
})