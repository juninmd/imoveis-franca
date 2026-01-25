import type { Config } from 'jest';

const config: Config = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/client/', 'content.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts', // Exclude entry point
    '!src/infra/redis.ts', // Exclude infrastructure
    '!src/sites/**/*.ts' // Exclude scrapers from strict coverage (they are tested but hard to 100% branch cover)
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
