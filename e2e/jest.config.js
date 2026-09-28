module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/e2e/**/*.test.ts'],
  testTimeout: 120000,
  reporters: ['detox/runners/jest/reporter'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
};
