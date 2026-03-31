import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.js'],
    include: ['utils/__tests__/**/*.spec.{js,ts}'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'api/**'],
  },
})
