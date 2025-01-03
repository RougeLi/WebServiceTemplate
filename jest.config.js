/**
 * For a comprehensive explanation of each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
const config = {
  clearMocks: true,
  collectCoverageFrom: ['**/*.(t|j)s'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/prisma/',
    '/tests/',
    '/test-utils/',
    '/constants/',
    '.*.mock.ts$',
    '.*.spec.ts$',
    '.*.module.ts$',
    '.*.route.ts$',
    '.*.config.ts$',
    '.*.types.ts$',
    '.*.dto.ts$',
    '.*.error.ts$',
    'index.ts',
    'setup-app.ts',
    'application.ts',
    'web-server.ts',
    'global-di-configs.ts',
    'modules.ts',
  ],
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleFileExtensions: ['js', 'ts', 'json', 'node'],
  preset: 'ts-jest',
  rootDir: './',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'node',
};

export default config;
