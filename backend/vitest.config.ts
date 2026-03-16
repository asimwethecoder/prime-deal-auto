import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/integration/**/*.test.ts'], // Exclude integration tests by default
    setupFiles: ['./tests/setup.ts'],
    mockReset: true,
  },
});
