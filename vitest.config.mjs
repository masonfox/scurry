import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    include: ['**/__tests__/**/*.js', '**/__tests__/**/*.mjs', '**/__tests__/**/*.jsx', '**/?(*.)+(spec|test).js', '**/?(*.)+(spec|test).mjs', '**/?(*.)+(spec|test).jsx'],
    exclude: ['**/__tests__/helpers/**', '**/node_modules/**', '**/dist/**', '**/build/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['app/**/*.{js,jsx}', 'src/**/*.{js,jsx}'],
      exclude: [
        '**/__tests__/**',
        '**/*.test.{js,jsx,mjs}',
        '**/*.spec.{js,jsx,mjs}',
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**',
        'app/layout.js',
        'app/components/**',
        'app/page.jsx',
        'app/login/page.jsx',
      ],
      all: true,
      clean: true,
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60
      }
    },
  },
  resolve: {
    alias: {
      '@': __dirname,
      'server-only': path.resolve(__dirname, '__mocks__/server-only.js'),
    },
  },
});
