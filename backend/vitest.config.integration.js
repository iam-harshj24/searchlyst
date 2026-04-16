import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.js'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    reporters: ['verbose', 'junit'],
    outputFile: {
      junit: './results/junit.xml',
    },
  },
});
