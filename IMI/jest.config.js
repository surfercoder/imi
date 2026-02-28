/** @type {import('jest').Config} */
const config = {
  watchman: false,
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      preset: 'ts-jest',
      testMatch: [
        '<rootDir>/__tests__/schemas/**/*.test.ts',
        '<rootDir>/__tests__/services/**/*.test.ts',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react' } }],
      },
    },
    {
      displayName: 'react-native',
      preset: 'jest-expo',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testMatch: [
        '<rootDir>/__tests__/context/**/*.test.tsx',
        '<rootDir>/__tests__/components/**/*.test.tsx',
        '<rootDir>/__tests__/app/**/*.test.tsx',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@supabase/.*|@testing-library/.*)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^expo/src/winter.*$': '<rootDir>/__mocks__/expo-winter.js',
        '^expo/virtual/streams$': '<rootDir>/__mocks__/expo-winter.js',
      },
    },
  ],
  collectCoverageFrom: [
    'schemas/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'context/**/*.{ts,tsx}',
    'components/ui/**/*.{ts,tsx}',
    '!components/ui/colors.ts',
    'app/**/*.{ts,tsx}',
    '!app/**/_layout.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.expo/**',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 99,
      statements: 99,
    },
  },
  coverageProvider: 'v8',
}

module.exports = config
