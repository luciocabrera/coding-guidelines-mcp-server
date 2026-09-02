import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The integration test drives a real child process; keep suites serial so the
    // spawned servers don't compete for stdio during a watch run.
    fileParallelism: false,
    coverage: {
      include: ['src/**/*.ts'],
      // The VS Code extension can only run inside VS Code's extension host.
      exclude: ['src/extension/**'],
    },
  },
});
