import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      // The VS Code extension can only run inside VS Code's extension host.
      exclude: ['src/extension/**'],
    },
  },
});
