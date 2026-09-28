/** @type {import('jest').Config} */
const config = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native|@shopify/flash-list|@react-native-async-storage|expo-av|expo-video|expo-image|expo-file-system|expo-notifications|expo-screen-orientation|expo-localization|expo-crypto|expo-device|expo-media-library|i18next|react-i18next)',
  ],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@/hooks/(useAudioPlayback|useNotifications|useProgressTracker|useSleepTimer|useSmartPlayback|useVideoEngine)$':
      '<rootDir>/hooks/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(jpg|jpeg|png|gif|webp|svg|mp3|mp4|wav|m4a)$': '<rootDir>/__mocks__/fileMock.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/android/', '/ios/'],
  // Limit the haste map to project dirs (excludes .kilo worktrees, dist, etc.)
  roots: [
    '<rootDir>/__tests__',
    '<rootDir>/__mocks__',
    '<rootDir>/app',
    '<rootDir>/assets',
    '<rootDir>/components',
    '<rootDir>/constants',
    '<rootDir>/features',
    '<rootDir>/hooks',
    '<rootDir>/services',
    '<rootDir>/src',
    '<rootDir>/store',
    '<rootDir>/types',
    '<rootDir>/utils',
  ],
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'store/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 15000,
};

module.exports = config;
