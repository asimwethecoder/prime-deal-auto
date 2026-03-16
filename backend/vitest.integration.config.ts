import { defineConfig } from 'vitest/config';

/**
 * Integration Test Configuration
 * 
 * Run with: npm run test:integration
 * 
 * Requires environment variables:
 * - DATABASE_URL or (SECRET_ARN + DB_HOST + DB_NAME)
 * - S3_BUCKET
 * - CLOUDFRONT_URL
 * - OPENSEARCH_ENDPOINT (optional, falls back to PG search)
 */
export default defineConfig({
  test: {
    root: '.',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // 30s timeout for database operations
    hookTimeout: 30000,
  },
});
