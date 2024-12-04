module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.e2e.test.ts'],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1'
  }
};