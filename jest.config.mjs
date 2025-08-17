/** @type {import('jest').Config} */
const config = {
  setupFiles: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/__tests__/**/*.mjs', '**/?(*.)+(spec|test).js', '**/?(*.)+(spec|test).mjs'],
  verbose: true,
  testTimeout: 10000,
  // extensionsToTreatAsEsm removed; Jest infers .js as ESM from package.json
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    "node_modules/(?!(graphql-request|nano)/)"
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  '^@/(.*)$': '<rootDir>/$1',
  '^server-only$': '<rootDir>/__mocks__/server-only.js',
  },
};
export default config;
