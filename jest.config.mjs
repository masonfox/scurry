/** @type {import('jest').Config} */
const config = {
  setupFiles: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/__tests__/**/*.mjs', '**/?(*.)+(spec|test).js', '**/?(*.)+(spec|test).mjs'],
  testPathIgnorePatterns: ['<rootDir>/__tests__/helpers/'],
  verbose: true,
  // extensionsToTreatAsEsm removed; Jest infers .js as ESM from package.json
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest',
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  '^@/(.*)$': '<rootDir>/$1',
  '^server-only$': '<rootDir>/__mocks__/server-only.js',
  },
  "collectCoverage":true,
};
export default config;
