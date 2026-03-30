/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/icons/**',
        'src/rounded/icons/**',
        'src/sharp/icons/**',
        'src/w*.ts',
        'src/rounded/w*.ts',
        'src/sharp/w*.ts',
      ],
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
