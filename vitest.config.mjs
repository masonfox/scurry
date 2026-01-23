import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.js'],
    include: ['**/__tests__/**/*.js', '**/__tests__/**/*.mjs', '**/?(*.)+(spec|test).js', '**/?(*.)+(spec|test).mjs'],
    exclude: ['**/__tests__/helpers/**', '**/node_modules/**', '**/dist/**', '**/build/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': __dirname,
      'server-only': path.resolve(__dirname, '__mocks__/server-only.js'),
    },
  },
});
