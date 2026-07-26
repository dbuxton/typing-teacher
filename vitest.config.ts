import { defineConfig } from 'vitest/config'

// The engine is pure TypeScript with no DOM and no JSX, so the test run needs
// no plugins and no browser environment — which keeps it fast.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
