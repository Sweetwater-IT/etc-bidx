/** @type {import('jest').Config} */
const config = {
  displayName: 'API Tests',
  testMatch: ['**/tests/api/**/*.test.js'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/tests/api/utils/setup.js'],
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  verbose: true,
  testTimeout: 30000,
  collectCoverage: true,
  collectCoverageFrom: [
    'app/api/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageDirectory: 'coverage/api',
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};

module.exports = config;
