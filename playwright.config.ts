import { defineConfig, devices } from '@playwright/test'

// Chromium is preinstalled in this environment at PLAYWRIGHT_BROWSERS_PATH, so
// there is never any need to run `playwright install`.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/typing-teacher/',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the Chromium already on the machine rather than downloading one.
        // Drop this launchOptions block if you run the tests somewhere that
        // manages its own browsers via `npx playwright install`.
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/typing-teacher/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
