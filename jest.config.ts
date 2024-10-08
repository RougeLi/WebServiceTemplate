import type { Config } from 'jest';

/**
 * For a comprehensive explanation of each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '<rootDir>/../coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'index.ts',
    'setup-app.ts',
    'application.ts',
    'web-server.ts',
    'global-containers.ts',
    'modules.ts',
    String.raw`.*\.module\.ts$`,
    String.raw`.*\.route\.ts$`,
    String.raw`.*\.config\.ts$`,
    String.raw`.*\.types\.ts$`,
    String.raw`.*\.dto\.ts$`,
    String.raw`.*\.error\.ts$`,
  ],
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleDirectories: ['node_modules', '<rootDir>/..'],
  moduleFileExtensions: ['js', 'ts', 'json', 'node'],
  preset: 'ts-jest',
  rootDir: 'src',
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'node',
};

// noinspection JSUnusedGlobalSymbols
export default config;
