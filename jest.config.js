// jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom', // Explicitly specify the environment
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS modules
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js', // Mock static assets
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'], // Setup file for additional configurations

  // **Override export conditions to fix MSW module resolution**
  testEnvironmentOptions: {
    customExportConditions: [''], // Opt out of the browser export condition
  },
};
