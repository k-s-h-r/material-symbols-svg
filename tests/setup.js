// Global test setup for Node.js scripts
import { afterEach } from 'vitest';
import { rimraf } from 'rimraf';

// Clean up temporary directories after each test
afterEach(async () => {
  // Clean up any test-specific temporary directories
  const tmpDirs = global.testTmpDirs || [];
  for (const dir of tmpDirs) {
    try {
      await rimraf(dir);
    } catch (error) {
      console.warn(`Failed to clean up temp directory: ${dir}`, error);
    }
  }
  global.testTmpDirs = [];
});

// Mock console methods to reduce noise in tests
globalThis.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};