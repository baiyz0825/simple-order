import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    dir: 'tests',
    globalSetup: ['tests/global-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    sequence: {
      sequential: true,
    },
    env: {
      DATABASE_URL: 'file:./data/test.db',
      JWT_SECRET: 'dev-secret-change-in-production',
      PORT: '3001',
    },
  },
})
